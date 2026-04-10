# Custom Domain & SSL Deployment Guide

This guide provides the exact step-by-step instructions to attach your custom domain to your AWS EC2 instance using an Application Load Balancer (ALB) and AWS Certificate Manager (ACM) to achieve secure `https://` access.

Because our application code already uses relative API paths (`/api`), **no code changes are required** in the Docker containers to support the new domain!

---

## Step 1: Request an SSL Certificate (ACM)
Before creating the load balancer, you need a free SSL certificate from AWS.

1. Open the **AWS Certificate Manager (ACM)** console.
2. Ensure you are in the **us-east-1 (N. Virginia)** region (mandatory for some front-facing services).
3. Click **Request a certificate** -> **Request a public certificate**.
4. Fully qualified domain name: Enter `yourdomain.com`.
5. Click **Add another name to this certificate** and enter `*.yourdomain.com` (to cover subdomains like `www`).
6. Validation method: **DNS validation**. Click Request.
7. Once requested, open the certificate details. You will see a button that says **Create records in Route 53**. Click it to automatically add the validation CNAMEs to your domain. 
8. Wait for the status to change to **Issued** (usually takes 3-5 minutes).

---

## Step 2: Create a Target Group
The ALB needs to know exactly which EC2 server and port to forward the traffic to.

1. Go to the **EC2 Console** -> Scroll down the left menu to **Target Groups** -> Click **Create target group**.
2. **Target type:** Instances.
3. **Target group name:** `ats-tg` (or similar).
4. **Protocol:** `HTTP` | **Port:** `80`.
5. **VPC:** Ensure your default VPC is selected.
6. **Health checks:** Leave as default (`/`). Click Next.
7. Select your running **Ubuntu EC2 instance** from the list.
8. Set ports for the selected instances to `80`, click **Include as pending below**, and then **Create target group**.

---

## Step 3: Create the Application Load Balancer
This is the bouncer that will accept HTTPS traffic and securely pass it to your EC2.

1. Go to **EC2 Console** -> **Load Balancers** -> Click **Create load balancer**.
2. Select **Application Load Balancer** -> Create.
3. **Name:** `ats-alb`
4. **Scheme:** Internet-facing.
5. **Network mapping:** Select your VPC. **Check at least TWO availability zones/subnets** (AWS requires this for ALBs, even if your server is only in one).
6. **Security groups:** Create a new security group or select one that allows **Inbound HTTP (80)** and **HTTPS (443)** from Anywhere (`0.0.0.0/0`).
7. **Listeners and routing:**
   - Protocol: **HTTPS** | Port: **443**
   - Default action: Forward to your `ats-tg` Target Group.
   - *(Optional but recommended)* Add another listener for **HTTP: 80** that redirects to HTTPS: 443.
8. **Secure listener settings:** Select "From ACM" and choose the certificate you created in Step 1.
9. Click **Create load balancer**.

---

## Step 4: Map Your Custom Domain in Route 53
Now we tell your domain to point to the new Load Balancer instead of the raw EC2 IP.

1. Go to the **Route 53 Console** -> **Hosted zones** -> Click your domain name.
2. Click **Create record**.
3. **Record name:** Leave blank for the root domain (e.g., `yourdomain.com`).
4. **Record type:** `A - Routes traffic to an IPv4 address and some AWS resources`.
5. **Alias:** Toggle the switch to **Yes / On**.
6. **Route traffic to:** 
   - Select **Alias to Application and Classic Load Balancer**.
   - Select your region (e.g., `us-east-1`).
   - Select your `ats-alb` (it should auto-populate).
7. Click **Create records**.

> [!TIP]
> DNS changes can take up to 30 minutes to propagate worldwide, though often it's much faster.

---

## Step 5: VERY IMPORTANT - Update AWS Cognito!
Your login system (Cognito) strictly blocks login requests from unknown URLs to prevent hijacking. If you try to log in via `https://yourdomain.com` right now, it will crash because it only expects your old EC2 IP!

1. Open the **Amazon Cognito** console -> Select your User Pool.
2. Go to the **App Integration** tab.
3. Scroll down to **App client list** and click on your specific client (`4td5k9rcuoph...`).
4. Scroll to **Hosted UI** and click **Edit**.
5. Add your new secure URLs. For example:
   - **Allowed callback URLs:** Add `https://yourdomain.com/` (Make sure to include the trailing slash if required by your frontend).
   - **Allowed sign-out URLs:** Add `https://yourdomain.com/`
6. Save the changes. 

Your platform is now fully secured with SSL, scaled behind an AWS Load Balancer, and mapped to your custom corporate domain!
