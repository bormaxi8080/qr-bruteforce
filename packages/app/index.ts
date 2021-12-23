import { v4 as uuidv4 } from "uuid";
import puppeteer from "puppeteer";
import fetch from "node-fetch";
import fs from "fs";

import config from "./config.json";
import { Count, Certificate } from "./types";

/**
 * Count of screenshots
 *
 * @var {Number}
 */
//const count: Count = 10;
const count: Count = Number(config.count);

/*
  Test function
  Returns certificate JSON if certificate exists
* */
export const getCertInfo = async (
  idCertificate: string
): Promise<Certificate | undefined> => {
  const response = await fetch(
    `https://www.gosuslugi.ru/api/vaccine/v2/cert/verify/${idCertificate}`
  );

  if (!response.ok || response.status === 204) {
    return;
  }

  return response.json() as Promise<Certificate>;
};

// Valid certificate check for test
//getCertInfo("117d099c-fe34-42f8-8ddd-bf47f79590c5")
//  .then((response) => {
//      return response;
//  })
//  .catch((err) => err);

/*
  The function waits until all images on the page are loaded
* */
function imagesHaveLoaded() {
  return Array.from(document.images).every((i) => i.complete);
};

console.log(`processing ${count} attempts to load certificates...`);

(async () => {
  let founded: Count = 0;

  const browser = await puppeteer.launch({
    defaultViewport: { width: 1000, height: 500 },
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',  // get Chrome browser
    headless: false // turn off headless mode because since government services will be define and block it
  });

  const page = await browser.newPage();

  for (let i = 0; i < count; i++) {
    const uid = uuidv4();
    //const uid = "117d099c-fe34-42f8-8ddd-bf47f79590c5";

    //console.log(uid);

    try {
      const response = await fetch(
          `https://www.gosuslugi.ru/api/vaccine/v2/cert/verify/${uid}`
      );

      if (response.ok && response.status !== 204) {
        founded++;
        console.log(`${uid}: certificate founded`);

        const body = await response.text();

        // Write certificate to JSON file
        fs.writeFile(`${__dirname}/${uid}.json`, body, null, function(err) {
            console.log(`${uid}: error writing certifcate json - ` + err);
        });

        await page.goto(
            `https://www.gosuslugi.ru/vaccine/cert/verify/${uid}`,
            {
              waitUntil: "networkidle2",
            }
        );

        // Waits until all images on the page are loaded
        // await page.waitForFunction(imagesHaveLoaded, { timeout: 30*1000 });

        // Write certificate screenshot
        await page.screenshot({
          path: `${__dirname}/${uid}.jpeg`,
        });
      }

    } catch (error) {
        console.log("execution error: " + error);
    }
  }

  console.log(`${founded} certificate(s) founded`);
  console.log(`done`);

  await browser.close();
})();
