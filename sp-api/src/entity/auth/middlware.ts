export const isLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    return res.status(403).json({ message: 'You must be logged in.' });
  }
  next();
};
