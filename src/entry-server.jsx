import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import { createSeoMarkup } from './seo.js';

export function render() {
  return {
    html: renderToString(<App />),
    head: createSeoMarkup(),
  };
}
