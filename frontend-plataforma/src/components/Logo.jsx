import { useState } from "react";
import { Link } from "react-router-dom";
import logoSrc from "../assets/logo-universidade-money.png";
import "../styles/brand.css";

const VARIANT_CLASS = {
  sidebar: "brand-logo brand-logo--sidebar",
  header: "brand-logo brand-logo--header",
  auth: "brand-logo brand-logo--auth",
};

export default function Logo({ variant = "header", linkTo = "/", className = "" }) {
  const [imgErro, setImgErro] = useState(false);
  const baseClass = VARIANT_CLASS[variant] || VARIANT_CLASS.header;
  const classes = `${baseClass}${className ? ` ${className}` : ""}`;

  const conteudo = imgErro ? (
    <span className="brand-logo-fallback">Universidade Money</span>
  ) : (
    <img src={logoSrc} alt="Universidade Money" onError={() => setImgErro(true)} />
  );

  if (linkTo == null) {
    return <div className={classes}>{conteudo}</div>;
  }

  return (
    <Link to={linkTo} className={classes} aria-label="Universidade Money">
      {conteudo}
    </Link>
  );
}
