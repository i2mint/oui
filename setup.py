# name = 'epythet'
# root_url = 'https://github.com/i2mint'
# version = '0.0.1'

import os

root_dir = os.path.dirname(__file__)
config_file = os.path.join(root_dir, 'setup.cfg')

from configparser import ConfigParser

c = ConfigParser()
c.read_file(open(config_file, 'r'))
name = c['metadata']['name']
root_url = c['metadata']['root_url']

more_setup_kwargs = dict(
    c['metadata'],
    install_requires=[
        'i2',
        'IPython',
    ],
    keywords=['User Interface', 'UI', 'sound recognition'],
    # download_url='{root_url}/{name}/archive/v{version}.zip'),
)

# from pip_packaging import next_version_for_package

# name = os.path.split(os.path.dirname(__file__))[-1]

# version = "0.0.1"  # for the initial publishing
# current_version = current_pypi_version(name)  # when you want to install from source
# version = next_version_for_package(name)  # when you want to make a new package
version = '0.0.0'

def readme():
    try:
        with open('README.md') as f:
            return f.read()
    except:
        return ""


ujoin = lambda *args: '/'.join(args)

if root_url.endswith('/'):
    root_url = root_url[:-1]


def my_setup(print_params=True, **setup_kwargs):
    from setuptools import setup
    if print_params:
        import json
        print("Setup params -------------------------------------------------------")
        print(json.dumps(setup_kwargs, indent=2))
        print("--------------------------------------------------------------------")
    setup(**setup_kwargs)


import setuptools

dflt_kwargs = dict(
    name=f"{name}",
    version=f'{version}',
    url=f"{root_url}/{name}",
    packages=setuptools.find_packages(),
    include_package_data=True,
    platforms='any',
    long_description=readme(),
    long_description_content_type="text/markdown",
)

setup_kwargs = dict(dflt_kwargs, **more_setup_kwargs)

my_setup(**setup_kwargs)
