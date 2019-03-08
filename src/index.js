'use strict'

const visit = require('unist-util-visit')
const fetch = require('node-fetch')

const getSpeakerdeckData = async (url) => {
  const response = await fetch(url)
  return await response.json()
};

const speakerdeckRegexp = /https:\/\/[\.]*speakerdeck\.com\/([A-Za-z0-9-_]+\/[A-Za-z0-9-_?=]+)/gi

// only do the embedding for a single twitter url on its own paragraph.
const isSpeakerDeckLink = node => {
  return node.children.length === 1 &&
    node.children[0].type === 'link' &&
    node.children[0].url.match(speakerdeckRegexp) &&
    node.children[0].children.length === 1 &&
    node.children[0].children[0].type === 'text' &&
    node.children[0].children[0].value === node.children[0].url
}

module.exports = async ({ markdownAST }, pluginOptions) => {
  const debug = pluginOptions.debug ? console.log : () => {}

  const nodes = []
  visit(markdownAST, `inlineCode`, node => {
    const { value } = node
    if (isSpeakerDeckLink(value)) {
      debug(`\nfound SpeakerDeck Link`, value.children[0].url)
      if (value.startsWith(`speakerdeck:`)) {
        const slideUrl = value.substr(8)
      }
      slideUrls.push([slideUrl, slideUrl.children[0].url])
    }
  })

  for (let i = 0; i < slideUrls.length; i++) {
    const nt = slideUrls[i]
    const node = nt[0]
    const speakerdeckLink = nt[1]
    debug(`\nembeding SpeakerDeck: ${speakerdeckLink}\n`)
    try {
      const embedData = await getSpeakerdeckData(speakerdeckLink)
      node.type = 'html'
      node.value = embedData.html
      node.children = null
    } catch (er) {
      debug(`\nfailed to get data for ${speakerdeckLink}\n`, er)
    }
  }

  return markdownAST
};
