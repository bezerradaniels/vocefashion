# Context & Persona
Act as an Expert UI/UX Designer and Frontend Developer. Your task is to generate a comprehensive Digital Manual of Visual Identity (MIV) and functional mobile-first UI components for a women's clothing e-commerce store called "Você Fashion", located in Bom Jesus da Lapa, Bahia, Brazil.

**CRITICAL CONSTRAINT:** While these instructions and component structures are described in English, **100% of the visible copy, placeholder text, user interface labels, and mock product data MUST be in Brazilian Portuguese (PT-BR).**

# 1. Brand & Strategy Context
*   **Traffic Source:** Over 90% of users will access the site via the Instagram mobile in-app browser. 
*   **Design Philosophy:** Strictly **Mobile-First**. Prioritize thumb-reachability, fast rendering, and seamless transitions from social media.
*   **UI Style:** Strictly adhere to "Flat UI" design principles. Use clean container cards, precise typography scales for strong visual hierarchy, and minimal to ZERO drop shadows. Avoid visual clutter. Let the product photography shine.

# 2. Global Visual Identity (MIV)
Implement the following design system tokens:

## Color Palette
*   **Primary/Text (`text-charcoal`):** `#2C2C2C` (Deep Charcoal/Soft Black - matching the "VC" monogram).
*   **Accent/Action (`bg-copper` / `text-copper`):** `#B87353` (Copper/Terracotta - matching the script "Você Fashion" logo). Use this for primary CTAs, sale tags, and active states.
*   **Backgrounds (`bg-alabaster`):** `#F8F8F8` for the main app background to reduce eye strain.
*   **Surfaces (`bg-white`):** `#FFFFFF` for product cards, bottom sheets, and containers to create subtle contrast without relying on shadows.
*   **Borders/Dividers (`border-light`):** `#E5E5E5` for clean, crisp separation.

## Typography
*   **Headings (H1, H2, Product Titles):** A high-contrast, elegant Serif font (e.g., `Playfair Display` or `Lora`) to echo the logo's sophistication.
*   **Body, Prices & UI Text:** A highly legible, modern Sans-serif (e.g., `Inter`, `Geist Sans`, or `SF Pro`).
*   **Scale:** Use a strict typography scale (Base 16px). Headings should feel editorial.

## Components & Styling
*   **Primary Buttons:** Flat design, full-width for mobile, pure Copper (`#B87353`) background, pure white text, completely flat (no drop shadows), subtle `4px` border radius (`rounded-sm`).
*   **Secondary Buttons:** Outline style, 1px charcoal border, transparent background, charcoal text.
*   **Assets & Iconography:** Minimalist, fine-line SVG icons (1.5px stroke width). Unfilled by default, filled for active states (e.g., a filled copper heart for wishlists).

# 3. Core UI Views to Generate
Please generate the code/UI for the following mobile screens, applying the MIV defined above:

## A. Product Listing Page (Listing / Grid)
*   **Header:** Sticky minimalist top header (Brand logo center, hamburger left, cart right).
*   **Navigation:** Horizontally scrollable category pill menu below the header (e.g., "Novidades", "Vestidos", "Blusas", "Promoção"). Active pill uses the Copper accent.
*   **Grid:** A standard 2-column mobile grid with minimal gap.
*   **Product Card:** Clean white container (`bg-white`), flat design, no shadow. Image takes up the top portion (aspect ratio 4:5 optimized for fashion). Below the image, left-aligned details: Category in small uppercase sans-serif, Product Name in Serif, Price in bold Sans-serif. No visible "Buy" button on the grid level to keep the UI clean.

## B. Product Details Page (PDP)
*   **Media:** Edge-to-edge image carousel taking up the top 55% of the screen. Minimalist pagination dots overlaid at the bottom of the image.
*   **Information Context:** Product name in elegant Serif (H1), price prominent in bold Sans-serif. A short, expandable description below.
*   **Selectors:** Minimalist size selection using flat square radio buttons (P, M, G, GG). Out-of-stock items should have a diagonal strikethrough.
*   **Action Bar:** A sticky bottom bar fixed to the bottom of the viewport containing a full-width primary CTA ("Adicionar à Sacola" or "Comprar Agora") in the Copper Accent color. This ensures the buy button is always accessible while scrolling.

## C. Checkout Experience (Mobile Optimized)
*   **Architecture:** Streamlined accordion or step-by-step mobile checkout (1. Identificação, 2. Entrega, 3. Pagamento).
*   **Forms:** Floating label input fields. Large tap targets for thumbs. Flat borders (`border-light`), focusing on the `border-copper` on active state.
*   **Trust Signals:** Minimalist icons for secure payment (Pix, Cartão de Crédito) and clear shipping calculation (Frete). Highlight PIX as the primary/preferred payment method (common in Brazil).
*   **Summary:** Sticky total at the bottom with a final, high-contrast CTA ("Finalizar Compra").

*Remember: Output the structural code, but all visible text must be beautifully written in Portuguese for a Brazilian fashion audience.*