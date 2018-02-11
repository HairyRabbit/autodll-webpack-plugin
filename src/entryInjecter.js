/**
 * inject module to entry
 *
 * @flow
 */

export default function injectEntry(webpackOptions: Object,
                                    injects: string | Array<string>): void {
  /**
   * webpack Entry type
   *
   * type Entry =
   *   | string
   *   | Array<string>
   *   | object { <key>: string | Array<string> }
   *   | () => Entry
   */
  if(Array.isArray(webpackOptions)) {
    /**
     * multi tasks
     */
    webpackOptions.forEach(opts => {
      injectEntry(opts, injects)
    })
    return
  } else {
    /**
     * single task
     */
    injects = Array.isArray(injects) ? injects : [injects]

    const entry = webpackOptions.entry
    const entryType =  typeof entry
    const isArray = Array.isArray(entry)

    if('object' === entryType && !isArray) {
      Object.keys(entry).forEach(key => {
        webpackOptions.entry[key] = injects.concat(entry[key])
      })
    } else if('function' === entryType) {
      webpackOptions.entry = entry(injects)
    } else {
      webpackOptions.entry = injects.concat(entry)
    }
  }
}
