import React from "react";
import ResumeHistory from "../components/ResumeHistory";
import ScoreCard from "../components/ScoreCard";

const Dashboard = ({ globalScore }) => {
  return (
    <div className="dashboard">
      <header>
        <h1>AI-Powered ATS Dashboard</h1>
        <p>Overview of candidate scores and resume insights.</p>
      </header>
      <main className="dashboard-main">
        <section className="dashboard-left">
          <ResumeHistory />
        </section>
        <section className="dashboard-right">
          <ScoreCard score={globalScore} />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

