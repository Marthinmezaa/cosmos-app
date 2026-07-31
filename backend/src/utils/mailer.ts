import { env } from "../config/env";
import { mailer } from "../config/mailer";

// El reseteo de contraseña ya cambió el hash en la base antes de llamar acá: si el
// envío de mail falla (SMTP caído, credenciales vencidas) no debe tirar abajo la
// respuesta al admin, que igual recibe la contraseña temporal para pasarla a mano.
export async function enviarPasswordTemporal(email: string, nombre: string, passwordTemporal: string) {
  try {
    await mailer.sendMail({
      from: env.MAIL_FROM,
      to: email,
      subject: "Cosmostrak - Nueva contraseña temporal",
      text: `Hola ${nombre},\n\nTu contraseña fue restablecida. Esta es tu nueva contraseña temporal:\n\n${passwordTemporal}\n\nPor seguridad, cambiala apenas inicies sesión.`,
    });
  } catch (error) {
    console.error(`Error enviando email de contraseña temporal a ${email}:`, error);
  }
}
