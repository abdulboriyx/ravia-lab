import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [
      ".next/**",
      "_next/**",
      "node_modules/**",
      "public/spatial-ravia/molstar/**",
      "spatial-ravia/molstar/**"
    ]
  }
];

export default eslintConfig;
