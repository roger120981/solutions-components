/** @license
 * Copyright 2022 Esri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { E2EPage, newE2EPage } from '@stencil/core/testing';

describe('solution-spatial-ref', () => {

  let page: E2EPage;
  beforeEach(async () => {
    page = await newE2EPage();
  });

  it('renders', async () => {
    await page.setContent('<solution-spatial-ref/>');

    const solution_spatial_ref = await page.find('solution-spatial-ref');
    expect(solution_spatial_ref).toHaveClass('hydrated');
    expect(await solution_spatial_ref.getProperty('defaultWkid')).toBe(102100);
    expect(await solution_spatial_ref.getProperty('value')).toBe('102100');
  });

  it('echoes value of contained spatial-ref component', async () => {
    await page.setContent('<solution-spatial-ref/>');
    await page.waitForChanges();

    const newSpatialRef = '2243';
    const spatial_ref = await page.find('spatial-ref');
    await page.waitForChanges();
    await spatial_ref.setProperty('value', newSpatialRef);
    await page.waitForChanges();

    const solution_spatial_ref = await page.find('solution-spatial-ref');
    expect(await solution_spatial_ref.getProperty('value')).toBe(newSpatialRef);
  });

});