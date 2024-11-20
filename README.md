# PegboardJS

[![License](https://img.shields.io/badge/License-MIT-License.svg)](https://opensource.org/license/mit)
[![Tests (main)](https://github.com/PegboardJS/Sets/actions/workflows/test.yaml/badge.svg?branch=main)](https://github.com/pushfoo/PegboardJS/Sets/actions/workflows/test.yaml?branch=main)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)

A tiny toolkit to help sharably prototype various tools.

## Goals
[counters]: https://docs.python.org/3/library/collections.html#collections.Counter

Provide good-enough versions of:

- [ ] Multi-character glyph parsing
- [ ] UI helpers for grid layout
- [ ] Set-related features[^1]

  - [x] Backports of standard `Set` features for older browsers
  - [ ] A class akin to Python's [`collections.Counter`][counter]
  - [ ] Multi-Sets [^2]


[jsset]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

[^1]: No `OrderedSet` is necessary since JavaScript's `Set` [iterates in insertion order][jsset].
[^2]: Also known as "bags" (or [`collections.Counter`][counters] if you know Python)
