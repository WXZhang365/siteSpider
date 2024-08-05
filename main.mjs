import path, { join } from 'path'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()
import { existsSync, mkdir, mkdirSync, writeFileSync } from 'fs'
const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

;['site', 'site/js', 'site/css', 'site/image'].forEach((p) => {
  mkdirSync(join(__dirname, p), {
    recursive: true,
  })
})

const wait = (/** @type {number} */ ms) =>
  new Promise((resolve) => setTimeout(resolve, ms))

const options = {
  target: process.env.SP_TARGET,
  localDir: (/** @type {string} */ p) => join(__dirname, 'site', p),
  indexPageName: 'index.html',
  baseUrl: (/** @type {String} */ p) => {
    return p.replace(join(__dirname, 'site'), '').replace(/\\/g, '/')
  },
  replace: [
    function alink(/** @type {cheerio.Root} */ $html) {
      /**
       * @type {{name:string,path:string,type:'html'}[]}}
       */
      const target = []
      $html('a').each((i, el) => {
        const $el = $html(el)
        const href = $el.attr('href')
        if (href != 'javascript:void(0);' && href) {
          if (href) {
            const tmp = href.split('?')
            const name = options.localDir(
              (tmp[0].includes('En') ? 'e_' : '') + tmp[1] + '.html'
            )
            const path = options.target + '/' + href
            target.push({ name, path, type: 'html' })
            $el.attr('href', options.baseUrl(name))
          } else {
            $el.attr('href', '404.html')
          }
        }
      })
      return target
    },
    function script(/** @type {cheerio.Root} */ $html) {
      /**
       * @type {{name:string,path:string,type:'js'}[]}}
       */
      const target = []
      $html('script').each((i, el) => {
        const $el = $html(el)
        const src = $el.attr('src')
        if (src) {
          const src = 'js/' + $el.attr('src')
          const p = options.localDir(src).split('\\')
          p.pop()
          mkdirSync(p.join('/'), {
            recursive: true,
          })
          const name = options.localDir(src)
          const path = options.target + '/' + $el.attr('src')
          target.push({ name, path, type: 'js' })
          $el.attr('src', options.baseUrl(name))
        }
      })
      return target
    },
    function link(/** @type {cheerio.Root} */ $html) {
      /**
       * @type {{name:string,path:string,type:'link'}[]}}
       */
      const target = []
      $html('link').each((i, el) => {
        const $el = $html(el)
        const href = $el.attr('href')
        if (href) {
          const href = 'css/' + $el.attr('href')
          const p = options.localDir(href).split('\\')
          p.pop()
          mkdirSync(p.join('/'), {
            recursive: true,
          })
          const name = options.localDir(href)
          /**
           * @type {any}
           */
          const path =
            $el.attr('href')?.indexOf('http') != -1
              ? $el.attr('href')
              : options.target + '/' + $el.attr('href')
          target.push({ name, path, type: 'link' })
          $el.attr('href', options.baseUrl(name))
        }
      })
      return target
    },
    function image(/** @type {cheerio.Root} */ $html) {
      /**
       * @type {{name:string,path:string,type:'image'}[]}}
       */
      const target = []
      $html('img').each((i, el) => {
        const $el = $html(el)
        let src = $el.attr('src')
        if (src) {
          src = 'image/' + src.replace(/^https?:\/\/[^\/]+\/?/, '')
          src = src.replace(/\?.*$/, '')

          const p = options.localDir(src).split('\\')
          p.pop()
          mkdirSync(p.join('/'), {
            recursive: true,
          })
          const name = options.localDir(src)
          const path =
            ($el.attr('src')?.indexOf('http') != -1
              ? $el.attr('src')
              : options.target + '/' + $el.attr('src')) || ''
          target.push({ name, path, type: 'image' })
          $el.attr('src', options.baseUrl(name))
        }
      })
      return target
    },
  ],
}

async function main() {
  /**
   * @type {{name:string,path:string,type:'html'|'link'|'js'|'image'}[]}}
   */
  const next = [
    {
      name: options.localDir(options.indexPageName),
      path: options.target,
      type: 'html',
    },
  ]
  /**
   * @type {{name:string,path:string,type:'html'|'link'|'js'|'image'}[]}}
   */
  const loaded = []
  /**
   * @type {{name:string,path:string,type:'html'|'link'|'js'|'image'}[]}}
   */
  const skipped = []
  let count = 10000
  let stop = null
  while (next.length && count--) {
    if (stop) {
      clearTimeout(stop)
    }
    stop = setTimeout(() => {
      if (next.length == 0) {
        count = 0
      }
    }, 1000)
    if (next.length === 0) {
      break
    }
    const v = next.shift()
    if (!v) {
      continue
    }
    const { name, path, type } = v
    if (loaded.find((i) => i.name === name)) {
      continue
    }
    try {
      if (type != 'html' && existsSync(name)) {
        console.log('skip', path)
        skipped.push(v)
        continue
      }
      throw null
    } catch (error) {
      console.log('fetch', path)
    }
    const resp = await fetch(path, { responseType: 'arraybuffer' })
    await wait(10)
    if (type === 'html') {
      const $html = cheerio.load(resp.toString('utf-8'))
      options.replace.forEach((replace) => {
        next.push(...replace($html))
      })
      writeFileSync(name, $html.html())
    } else {
      writeFileSync(name, Buffer.from(resp), 'binary')
    }
    loaded.push({
      name,
      path,
      type,
    })
  }
  writeFileSync('./result.json', JSON.stringify({ loaded, skipped }))
}

/**
 * @param {string} url
 * @param {object} [options]
 */
export async function fetch(url, options = {}) {
  const response = await axios
    .get(url, {
      responseType: 'arraybuffer',
      ...options,
    })
    .catch((e) => {
      console.log(e.response.data)
      return e.response
    })
  return response.data
}

main()
