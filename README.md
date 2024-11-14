# Sets

[![License](https://img.shields.io/badge/License-MIT-License.svg)](https://opensource.org/license/mit)
[![Tests (main)](https://github.com/PegboardJS/Sets/actions/workflows/test.yaml/badge.svg?branch=main)](https://github.com/pushfoo/PegboardJS/Sets/actions/workflows/test.yaml?branch=main)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)


**TL;DR:** Sets and set accessories

## Goals
[counters]: https://docs.python.org/3/library/collections.html#collections.Counter

Provide good-enough versions of:

- [x] Backports of standard `Set` features for older browsers
- [ ] Multi-Sets [^1]

[jsset]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

No `OrderedSet` is necessary since JavaScript's `Set` [iterates in insertion order][jsset].


[^1]: Also known as "bags" (or [`Counter`][counters] if you know Python)