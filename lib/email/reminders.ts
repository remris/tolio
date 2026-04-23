import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = process.env.EMAIL_FROM ?? 'Tolio <noreply@tolio.app>'

export async function sendMaintenanceReminder(opts: {
  to: string
  companyName: string
  assetName: string
  dueDate: string
  type: 'maintenance' | 'tuv'
}) {
  const label = opts.type === 'tuv' ? 'TÜV' : 'Wartung'
  const subject = `[Tolio] ${label} fällig: ${opts.assetName}`

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#111">⚠️ ${label} Erinnerung</h2>
        <p>Für <strong>${opts.assetName}</strong> in Ihrer Firma <strong>${opts.companyName}</strong> ist eine ${label} fällig.</p>
        <table style="border-collapse:collapse;width:100%">
          <tr>
            <td style="padding:8px;border:1px solid #eee;color:#555">Asset</td>
            <td style="padding:8px;border:1px solid #eee;font-weight:bold">${opts.assetName}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;color:#555">${label} fällig am</td>
            <td style="padding:8px;border:1px solid #eee;font-weight:bold">${opts.dueDate}</td>
          </tr>
        </table>
        <p style="margin-top:24px;color:#888;font-size:12px">Diese E-Mail wurde automatisch von Tolio gesendet.</p>
      </div>
    `,
  })
}

