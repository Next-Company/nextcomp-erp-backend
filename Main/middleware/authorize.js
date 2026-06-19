// niv=1 → admin (full access)
// niv>1 → restricted user (read-only on protected routes)
// minLevel=1 means: only niv=1 users may proceed
export function authorize(minLevel = 1) {
  return (req, res, next) => {
    const session = req.session;
    if (!session || !session.id) {
      return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
    }
    if (parseInt(session.niv) > minLevel) {
      return res.status(403).json({ ok: false, mensaje: 'Sin permisos para esta operación' });
    }
    next();
  };
}
