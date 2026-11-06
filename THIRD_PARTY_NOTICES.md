# Third-party notices

## Hanzi Writer 3.7.3

SwiftDictionary uses Hanzi Writer to render Chinese characters and animate stroke order.

- Project: https://github.com/chanind/hanzi-writer
- Documentation: https://hanziwriter.org/docs.html
- License: MIT
- Copyright: Copyright (c) 2014 David Chanin

The Hanzi Writer JavaScript library is loaded from jsDelivr at runtime. The MIT license permits reuse, including commercial reuse, provided that the copyright and permission notice are retained with copies or substantial portions of the software. The MIT license text is reproduced below.

### MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Hanzi Writer character stroke data

- Data project: https://github.com/chanind/hanzi-writer-data
- Original data source: https://github.com/skishore/makemeahanzi
- License identified by the upstream data project: Arphic Public License
- License text: `ARPHICPL.TXT` (included in this release)

The upstream Hanzi Writer Data project states that its character data is licensed separately from Hanzi Writer's source code, originates from Make Me a Hanzi, and was extracted from fonts by Arphic Technology. SwiftDictionary requests character JSON from `hanzi-writer-data@2.0.1` at runtime; it does not bundle or modify those JSON files in this release. The unmodified license text is supplied as a notice for the upstream data lineage.

The MIT license for the JavaScript library does not replace the separate license for the stroke data. Reassess the exact terms before bundling, modifying, redistributing the data, or introducing paid features that use it.
