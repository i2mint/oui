# ui_components

Making highly reusable UI components for sound recognition pipelines. 

If more people use a component, reuse is a given. 
So how do we make more people use a component?
The component should be:
* useful
* easy to use
* easy to adapt (because one size rarely fits all)

We should have three "contexts" in mind:
* use in front-end dev
* use from python (dash -- or other py-js bridgin tool)
* use from python (jupyter notebooks)

What components?
Some really high level ones (lists, tables, nested data)?
Some more specific: Hear/view sound, configs CRUD, etc.

# Architectural notes

The following are just suggestions, but follow them unless you have a 
defendable reason not to. Also, do add/edit these if you have some ideas of your
own.

One folder per component, with python interface in the `__init__.py` under it. 

If python and js need to share some resources (say settings, defaults, etc.), 
put these in ONE place (for example a json file) from which both python and js 
will source these.

Include as many defaults and annotations as possible. We want the components to 
be used out-of-the-box, and only tuned if and when needed. 
Defaults can be dumb values, or "smart" 
(set dynamically according to the context)

Name your values. For example, instead of `24` or `3600` in the code, define
`HOURS_PER_DAY = 24` and `SECONDS_PER_HOUR = 3600` and use these names. 

Extract as many variables from the code and and perculate them higher in the 
interface (such as function arguments or module constants). 


# Components

Keep in mind: What are our abstract objects and operations that we want the user 
to perform on these, and what ways can we provide to do so.

What kinds of ways can I allow the user to view, navigate, search, create, 
or edit... lists, tables, nested data?

What kinds of data do we typically deal with, and in what form, and what 
do we do with this data? We have sounds and annotations thereof. 
We want to be able to upload and download sounds, hear and view them, do 
CRUD on annotations, go from annotations to annoted (sound) and see 
what annotations we have for a given sounds.

Etc.


## Lists

Ways to view lists of jsons. 
Needs a list nevigation and a json viewing protocol.

## Tables

Ideally one that tries to adapt automatically to a context 
(e.g. what do we do when the table is too small/big horizontally/vertically), 
but with many properties than can be turned off/on or parametrized 
(e.g. sortable, searchable, collapsable, etc)


## Nested data

Collapse/Expand file tree view?
Page by page flat view?

## Configs CRUD

## Hear sound

What do we do when the sound is big?

## View sound

What do we do when the sound is big?

### Spectrogram

What do we do when the sound is big?

### waveform plot (and aggregates)

## Putting viewing and hearing together

## Splatter stuff

## Named selections

Of sounds, annotations, etc.

# Contents

## useful

## easy

## adaptable


# Reusability tricks

## useful

## easy

## adaptable