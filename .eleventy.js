const { execSync } = require('child_process')
const cleanCSS = require("clean-css");
const htmlmin = require("html-minifier-terser");
const { minify } = require("terser");
const { nanoid } = require("nanoid");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const eleventyNavigation = require("@11ty/eleventy-navigation");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const pluginTOC = require('@uncenter/eleventy-plugin-toc');

module.exports = function (eleventyConfig) {
    eleventyConfig.setBrowserSyncConfig({
		files: './_site/css/**/*.css'
	});

    eleventyConfig.addPlugin(eleventyNavigation);
    
    eleventyConfig.addNunjucksGlobal("nanoid", () => nanoid());

    eleventyConfig.addNunjucksGlobal("isHtmlElement", function (string) {
        const dom = new JSDOM(string);
        const newNode = dom.window.document.querySelector("body").firstChild;
        if (newNode.nodeType === 1) {
            return true;
        }
        return false;
    });

    eleventyConfig.addNunjucksGlobal("addAttribute", function (string, toAdd) {
        const dom = new JSDOM(string);
        const newNode = dom.window.document.querySelector("body").firstChild;
        for (const attribute in toAdd) {
			newNode.setAttribute(`${attribute}`, `${toAdd[attribute]}`);
		}
		
        return newNode.outerHTML;
    });

    eleventyConfig.addNunjucksGlobal("addClass", function (string, toAdd) {
        const dom = new JSDOM(string);
        const newNode = dom.window.document.querySelector("body").firstChild;
        if (typeof toAdd === "string") {
            newNode.classList.add(toAdd);
        } else if (typeof toAdd === "object") {
            toAdd.forEach((item) => {
                newNode.classList.add(item);
            });
        }

        return newNode.outerHTML;
    });

    eleventyConfig.addFilter("cssmin", function (code) {
        return new cleanCSS({ level: 2 }).minify(code).styles;
    });

    eleventyConfig.addTransform("htmlmin", (content, outputPath) => {
        if (outputPath.endsWith(".html")) {
            return htmlmin.minify(content, {
                collapseWhitespace: true,
                removeComments: true,
                useShortDoctype: true,
            });
        }

        return content;
    });

    eleventyConfig.addNunjucksAsyncFilter("jsmin", async function (code, callback) {
        try {
            const minified = await minify(code);
            callback(null, minified.code);
        } catch (err) {
            console.error("Terser error: ", err);
            callback(null, code);
        }
    });

    eleventyConfig.addPassthroughCopy("src/assets/img");
    eleventyConfig.addPassthroughCopy({ "src/imagery/system-icons.json": "assets/js/system-icons.json" });

    eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
    eleventyConfig.addPlugin(pluginTOC);

    eleventyConfig.on('eleventy.after', () => {
		execSync(`npx pagefind --site dist --glob \"**/*.html\"`, { encoding: 'utf-8' })
	});

    return {
        pathPrefix: "/eleventy-demo/",
        dir: {
            input: "src",
            output: "dist",
        },
    };
};
