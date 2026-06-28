import { defineUserConfig } from "vuepress";
import { hopeTheme } from "vuepress-theme-hope";
import { viteBundler } from "@vuepress/bundler-vite";

export default defineUserConfig({
  title: "BakaCoder",
  bundler: viteBundler(),
  head: [["link", { rel: "icon", href: "/suspicious_eyes.png" }]],
  theme: hopeTheme({
    hostname: "https://bakacoder.com",
    logo: "/gintoki_logo.png",
    favicon: "/suspicious_eyes.png",
    author: {
      name: "Samrat Saha",
      url: "https://github.com/samizzy",
    },
    docsRepo: "https://github.com/samizzy/techblog",
    docsBranch: "master",
    docsDir: ".",
    lastUpdated: true,
    navbar: [
      { text: "Home", link: "/" },
      { text: "Categories", link: "/category/" },
      { text: "Tags", link: "/tag/" },
    ],
    sidebar: false,
    blog: {
      avatar: "/thorfinn_avatar.jpg",
      roundAvatar: true,
      name: "samizzy",
      description:
        "Notes from a backend engineer navigating clean code, broken builds, and the occasional existential crisis",
      medias: {
        GitHub: "https://github.com/samizzy",
      },
    },
    darkmode: "toggle",
    plugins: {
      blog: true,
    },
  }),
});
