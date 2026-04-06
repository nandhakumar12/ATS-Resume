from setuptools import setup, find_packages

setup(
    name="CloudResumeSanitizer",
    version="1.0.0",
    description="A professional OOP library for PII redaction in recruitment documents.",
    author="MSc Cloud Student",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=[],
)
