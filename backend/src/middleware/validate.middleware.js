function required(value) {
  if (!value || value.trim() === "") {
    throw new Error("Ce champ est requis.");
  }
}

function isEmail(value) {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("Format d'email invalide.");
  }
}

function minLength(n) {
  return function(value) {
    if (value && value.length < n) {
      throw new Error(`Minimum ${n} caractères.`);
    }
  };
}

function optional(fn) {
  return function(value) {
    if (value && value.trim() !== "") {
      return fn(value);
    }
  };
}

function validate(rules) {
  return function(req, res, next) {
    const errors = {};
    for (const [field, validators] of Object.entries(rules)) {
      const value = req.body[field];
      for (const validator of validators) {
        try {
          validator(value);
        } catch (e) {
          if (!errors[field]) errors[field] = [];
          errors[field].push(e.message);
        }
      }
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    next();
  };
}

module.exports = { validate, required, isEmail, minLength, optional };
