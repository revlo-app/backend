// Config file to keep tax rates and deduction values up-to-date
const rates = {
    federalTaxBrackets: [
        { rate: 0.1, income: 11000 },
        { rate: 0.12, income: 44725 },
        { rate: 0.22, income: 95375 },
        { rate: 0.24, income: 182100 },
        { rate: 0.32, income: 231250 },
        { rate: 0.35, income: 578125 },
        { rate: 0.37, income: Infinity }
    ],
    selfEmploymentTaxRate: 0.153, // 15.3% self-employment tax (federal only)
    selfEmploymentTaxDeductionRate: 0.5, // 50% deductible for SE tax
    qbiDeductionRate: 0.2, // 20% Qualified Business Income deduction
    standardDeduction: 13850, // Standard deduction for 2024
    stateTaxRates: {
        AL: 0.05, AK: 0, AZ: 0.0454, AR: 0.049, CA: 0.093, CO: 0.0455,
        CT: 0.05, DE: 0.066, FL: 0, GA: 0.0575, HI: 0.0825, ID: 0.058,
        IL: 0.0495, IN: 0.0323, IA: 0.048, KS: 0.0525, KY: 0.05, LA: 0.04,
        ME: 0.0715, MD: 0.0575, MA: 0.05, MI: 0.0425, MN: 0.0535, MS: 0.05,
        MO: 0.054, MT: 0.065, NE: 0.0684, NV: 0, NH: 0, NJ: 0.057, NM: 0.049,
        NY: 0.0641, NC: 0.0495, ND: 0.019, OH: 0.0285, OK: 0.05, OR: 0.099,
        PA: 0.0307, RI: 0.0599, SC: 0.07, SD: 0, TN: 0, TX: 0, UT: 0.0495,
        VT: 0.068, VA: 0.0575, WA: 0, WV: 0.065, WI: 0.053, WY: 0
    }
};

module.exports = rates;
