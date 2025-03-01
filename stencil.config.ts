import autoprefixer from 'autoprefixer';
import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import { postcss } from '@stencil-community/postcss';
import tailwindcss from 'tailwindcss';
import tailwindConfig from './tailwind.config';
import { generatePreactTypes } from './support/preact';

export const config: Config = {
  namespace: 'solutions-components',
  globalStyle: 'src/assets/styles/styles.scss',
  minifyJs: true,
  minifyCss: true,
  sourceMap: false,
  outputTargets: [
    {
      type: 'dist',
      copy: [
        {
          src: 'assets/arcgis-pdf-creator',
          dest: '../assets/arcgis-pdf-creator'
        },
        {
          src: 'assets/data',
          dest: '../assets/data'
        },
        {
          src: 'assets/t9n',
          dest: '../assets/t9n'
        },
        { src: 'demos' },
        { src: 'utils' }
      ]
    },
    {
      type: 'docs-readme'
    },
    {
       type: 'custom',
       name: 'preact',
       generator: generatePreactTypes
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements'
    },
  ],
  testing: {
    browserHeadless: 'new',
    testPathIgnorePatterns: [
      'dist/',
      'placeholder_tests'
    ],
    transform: {
      '^.+\\.[jt]sx?$': '<rootDir>/node_modules/@stencil/core/testing/jest-preprocessor.js'
    }
  },
  plugins: [
    sass({
      injectGlobalPaths: ['src/assets/styles/includes.scss']
    }),
    postcss({
      plugins: [
        tailwindcss(tailwindConfig),
        autoprefixer()
      ]
    })
  ],
  preamble: 'Copyright 2022 Esri\nLicensed under the Apache License, Version 2.0\nhttp://www.apache.org/licenses/LICENSE-2.0'
};
