import os
from setuptools import setup, find_packages
import pathlib

here = pathlib.Path(__file__).parent.resolve()

# Get the long description from the README file
long_description = (here / "readme.md").read_text(encoding="utf-8")

deps = [
    "numpy",
    "Flask-Cors",
    "psutil",
    "colorlog",
    "pandas"
]

DATA_FOLDERS = [
    "gm",
    "ch"
]

def list_files_update(directory, whitelist_files=[], whitelist_folders=[]):
    """
    Returns the paths of all children files after checking it with the
    whitelisted folders or files.
    directory: Path to iterate
    whitelist_files: Array(files to only consider)
    whitelist_folders: Array(folders to only consider)
    """
    paths = []
    if len(whitelist_folders) > 0:
        for item in os.listdir(directory):
            if item in whitelist_folders:
                for (path, directories, filenames) in os.walk(
                    os.path.join(directory, item)
                ):
                    paths += [os.path.join(path, f) for f in filenames]

    if len(whitelist_files) > 0:
        for (path, directories, filenames) in os.walk(directory):
            paths += [os.path.join(path, f) for f in filenames if f in whitelist_files]

    return paths

data_files = list_files_update("data", whitelist_folders=DATA_FOLDERS)


setup(
    name="DMVis",
    version="0.0.1",
    description="DMVis - Visual analytic interface for DMTracker.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/jarusified/avonsiv",
    author="Suraj Kesavan",
    author_email="jarus3001@gmail.com",
    classifiers=[
        "Development Status :: 3 - Alpha",
        # Indicate who your project is intended for
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Build Tools",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3 :: Only",
    ],
    keywords="Data Movement Visualization, Performance Analysis",
    packages=find_packages(),
    python_requires=">=3.7, <4",
    include_package_data=True,
    package_data={
        "data": data_files,
    },
    entry_points={
        "console_scripts": [
            "dmvis = server.dmv:main",
        ],
    },
    project_urls={
        "Bug Reports": "https://github.com/jarusified/avonsiv/issues",
        "Source": "https://github.com/jarusified/avonsiv/",
    },
    install_requires=deps,
)
