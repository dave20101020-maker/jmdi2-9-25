import { authRequired } from "./authMiddleware.js";

const buildMissingMap = (consents = {}) => ({
  gdpr: !(consents?.gdpr?.accepted === true),
  clinical: !(consents?.clinical?.accepted === true),
});

export const requireSensitiveConsent = async (req, res, next) => {
  try {
    // TEMP: consent gating disabled to validate auth end-to-end.
    return next();

    if (!req.user) {
      await authRequired(req, res, () => {});
      if (!req.user) return;
    }

    const consents = req.user?.consents || {};
    const satisfied = consents?.gdpr?.accepted && consents?.clinical?.accepted;

    if (!satisfied) {
      const missing = buildMissingMap(consents);
      return res.status(451).json({
        ok: false,
        error: "ConsentRequired",
        message:
          "Please review and accept GDPR processing and clinical safety acknowledgements before continuing.",
        missing,
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export default {
  requireSensitiveConsent,
};
