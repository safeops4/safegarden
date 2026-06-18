function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      for (const rule of rules) {
        const error = rule(value, field);
        if (error) {
          errors.push(error);
          break;
        }
      }
    }
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join("; ") });
    }
    next();
  };
}

const required = (value, field) => {
  if (!value || (typeof value === "string" && !value.trim())) {
    return `Le champ "${field}" est requis`;
  }
  return null;
};

const isEmail = (value, field) => {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return `Le champ "${field}" doit être un email valide`;
  }
  return null;
};

const minLength = (min) => (value, field) => {
  if (value && value.length < min) {
    return `Le champ "${field}" doit contenir au moins ${min} caractères`;
  }
  return null;
};

module.exports = { validate, required, isEmail, minLength };
