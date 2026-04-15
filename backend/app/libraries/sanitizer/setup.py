from setuptools import setup, find_packages
import os

# Read the contents of your README file
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="CloudResumeSanitizer",
    version="1.0.1",
    description="A professional OOP library for PII redaction.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Nandhakumar Thangaraju",
    author_email="nt.25126067@student.ncirl.ie",
    url="https://github.com/nandhakumar12/ATS-Resume",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=[],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Security",
    ],
)
