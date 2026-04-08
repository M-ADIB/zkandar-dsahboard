/**
 * buildCampaignEmail — renders EmailBlock[] into a fully branded Zkandar AI HTML email.
 *
 * Matches the exact design system used in send-auth-email/index.ts:
 *   Background: #0B0B0B  |  Card: #111111  |  Border: #1F2937  |  Lime: #D0FF71
 */

import type { EmailBlock } from '@/types/database'

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BRAND_BG = '#0B0B0B'
const CARD_BG = '#111111'
const BORDER = '#1F2937'
const LIME = '#D0FF71'
const LIME_TEXT = '#0B0B0B'
const GRAY_300 = '#D1D5DB'
const GRAY_400 = '#9CA3AF'
const WHITE = '#FFFFFF'

// ── Outer shell ───────────────────────────────────────────────────────────────
function wrapHtml(subject: string, bodyRows: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${subject}</title>
  <style>body,table,td{font-family:Arial,sans-serif!important;}</style>
</head>
<body style="margin:0;padding:0;background:${BRAND_BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:${CARD_BG};border:1px solid ${BORDER};border-radius:16px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Logo / brand -->
                <tr>
                  <td style="padding:24px 24px 0 24px;">
                    <div style="font-family:Arial,sans-serif;font-size:20px;font-weight:900;color:${WHITE};letter-spacing:-0.5px;">
                      Zkandar <span style="color:${LIME};">AI</span>
                    </div>
                  </td>
                </tr>

                ${bodyRows}

                <!-- Footer -->
                <tr>
                  <td style="padding:0 24px 24px 24px;border-top:1px solid ${BORDER};margin-top:24px;">
                    <div style="font-family:Arial,sans-serif;font-size:11px;color:${GRAY_400};margin-top:20px;line-height:1.6;">
                      You received this email because you are connected with Zkandar AI.
                      If you believe this was sent in error, please contact admin@zkandar.com.
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Block renderers ───────────────────────────────────────────────────────────

function renderHeading(text: string): string {
    return `<tr>
  <td style="padding:20px 24px 8px 24px;">
    <div style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:${WHITE};line-height:1.3;">${text}</div>
  </td>
</tr>`
}

function renderParagraph(text: string): string {
    return `<tr>
  <td style="padding:8px 24px;">
    <div style="font-family:Arial,sans-serif;font-size:14px;color:${GRAY_300};line-height:1.7;">${text}</div>
  </td>
</tr>`
}

function renderBulletList(items: string[]): string {
    const lis = items
        .map(
            (item) =>
                `<li style="font-family:Arial,sans-serif;font-size:14px;color:${GRAY_300};line-height:1.7;margin-bottom:6px;">${item}</li>`
        )
        .join('')
    return `<tr>
  <td style="padding:8px 24px 8px 40px;">
    <ul style="margin:0;padding-left:18px;">${lis}</ul>
  </td>
</tr>`
}

function renderImage(url: string, alt: string): string {
    return `<tr>
  <td style="padding:12px 24px;">
    <img src="${url}" alt="${alt}" style="width:100%;max-width:552px;height:auto;border-radius:12px;display:block;" />
  </td>
</tr>`
}

function renderDivider(): string {
    return `<tr>
  <td style="padding:12px 24px;">
    <div style="border-top:1px solid ${BORDER};"></div>
  </td>
</tr>`
}

function renderSpacer(height: number): string {
    return `<tr>
  <td style="padding:0;height:${height}px;line-height:${height}px;font-size:1px;">&nbsp;</td>
</tr>`
}

function renderButton(label: string, url: string): string {
    return `<tr>
  <td style="padding:12px 24px;">
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td bgcolor="${LIME}" style="border-radius:10px;">
          <a href="${url}" style="display:inline-block;padding:14px 24px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:${LIME_TEXT};text-decoration:none;border-radius:10px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>`
}

function renderHeadlineRow(headline: string): string {
    return `<tr>
  <td style="padding:20px 24px 12px 24px;border-bottom:1px solid ${BORDER};">
    <div style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:${WHITE};">${headline}</div>
  </td>
</tr>`
}

// ── Block dispatcher ──────────────────────────────────────────────────────────
function renderBlock(block: EmailBlock): string {
    switch (block.type) {
        case 'heading':
            return renderHeading(block.text)
        case 'paragraph':
            return renderParagraph(block.text)
        case 'bullet_list':
            return renderBulletList(block.items)
        case 'image':
            return renderImage(block.url, block.alt || '')
        case 'divider':
            return renderDivider()
        case 'spacer':
            return renderSpacer(block.height)
        case 'button':
            return renderButton(block.label, block.url)
        default:
            return ''
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface CampaignEmailData {
    subject: string
    headline?: string | null
    blocks: EmailBlock[]
    ctaText?: string | null
    ctaUrl?: string | null
}

/**
 * Builds a fully rendered HTML email string from structured block data.
 *
 * @param data  - The campaign content (subject, headline, blocks, optional CTA)
 * @param recipientName - Used to replace {{name}} placeholders
 * @returns Complete HTML email string
 */
export function buildCampaignEmail(data: CampaignEmailData, recipientName?: string): string {
    const rows: string[] = []

    // Optional headline banner
    if (data.headline) {
        rows.push(renderHeadlineRow(data.headline))
    }

    // Content blocks
    for (const block of data.blocks) {
        rows.push(renderBlock(block))
    }

    // Global CTA at the bottom
    if (data.ctaText && data.ctaUrl) {
        rows.push(renderButton(data.ctaText, data.ctaUrl))
    }

    let html = wrapHtml(data.subject, rows.join('\n'))

    // Replace {{name}} placeholder
    if (recipientName) {
        html = html.split('{{name}}').join(recipientName)
    } else {
        html = html.split('{{name}}').join('')
    }

    return html
}
