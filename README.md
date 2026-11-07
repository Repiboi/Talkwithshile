# Talkwithshile — Premium Herbal Wellness Website

A redesigned, responsive, accessible product-catalogue website made from your original Talkwithshile project. No Node.js, npm, Bootstrap or server is required to view it.

## Open locally

1. Unzip the download.
2. Open `index.html` in Chrome, Edge, Firefox or Safari.
3. For a local development server, you may alternatively run `python -m http.server 8000` inside this folder, then visit http://localhost:8000.

## Features

- Responsive desktop, tablet, and mobile layout, with a working mobile menu
- All 12 products extracted from the original website
- Product search, category filtering, sorting, and product detail popups
- Product enquiry list with adjustable quantities, saved across page refreshes using `localStorage`
- WhatsApp sharing of a prewritten enquiry and a Copy Message option
- Accessible labels, focusable dialogs, keyboard Escape/Tab handling, and reduced-motion support
- FAQs, brand story, product discovery guidance, contact call-to-action
- SEO basics, favicon, no runtime framework/build dependencies

## IMPORTANT: Configure direct business contact before launch

Open `js/config.js` and set the verified official Talkwithshile WhatsApp number using its country code and digits only:

```js
window.TWS_CONFIG = {
  businessWhatsApp: '234XXXXXXXXXX',
  businessEmail: '',
};
```

Without a WhatsApp number, the share button **opens WhatsApp's generic sharing screen** so the visitor can choose a recipient; it does **not** message Talkwithshile directly. The original project had no verified official Talkwithshile number or email. Its social links pointed to personal-looking Repiboi Offishal accounts and were intentionally **not** represented as official brand accounts.

## Product catalogue

Products are in `js/products.js`. The names and image URLs came from the supplied original website. The product images are hosted at third-party Salescabal/S3 links and **may stop working** or be blocked; professionally styled product illustrations appear automatically when they do not load. For a production launch, replace `image` URLs with officially supplied local product photographs stored under `assets/`.

The two supplied promotional photos `assets/original-delay-oil.jpg` and `assets/original-infection-herbs.jpg` are preserved as reference assets. The main product tiles use the originals' external catalogue photo links when available, otherwise illustrative artwork. The hero illustration is conceptual, not a photo of a real packaged item.

No product prices, medical efficacy claims, certifications, customer testimonials, address, delivery claims, checkout/payment system, or official contact details were invented. The original product names have been retained. Review product labels and legal/regulatory obligations before going live, especially for products describing specific medical conditions or sensitive health concerns.

## What the enquiry feature does and does not do

The enquiry list uses browser-local storage. Sharing or copying a message is user-initiated and no private data is sent to this site or saved on a server. This is **not** a secure shop backend, order management system, medical advice service or real-money checkout.

## Deploy

This is a static website. You can publish the folder on GitHub Pages, Netlify or other static web hosting. Upload all files and folders with `index.html` at the site root. Configure your business WhatsApp number and use your verified product images before publishing.

## Project files

- `index.html` — full page markup
- `style.css` — all responsive styling
- `script.js` — navigation, filters, details, local enquiry list
- `js/products.js` — 12 original products and their images
- `js/config.js` — business contact settings
- `assets/` — logo, favicon, preserved reference photographs
