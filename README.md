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