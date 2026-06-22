import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import LandingFaq from "../components/landing/LandingFaq";
import LandingFeatures from "../components/landing/LandingFeatures";
import LandingFooter from "../components/landing/LandingFooter";
import LandingHeader from "../components/landing/LandingHeader";
import LandingHeroCarousel from "../components/landing/LandingHeroCarousel";
import LandingHowItWorks from "../components/landing/LandingHowItWorks";
import LandingPlansCarousel from "../components/landing/LandingPlansCarousel";
import LandingSocialProof from "../components/landing/LandingSocialProof";
import LandingStats from "../components/landing/LandingStats";
import LandingTopBar from "../components/landing/LandingTopBar";
import { getMe, isAuthenticated, logout } from "../services/api";
import { getLanding } from "../services/landingApi";
import "../styles/landing.css";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(isAuthenticated());
  const [landing, setLanding] = useState(null);
  const [loadingLanding, setLoadingLanding] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      getMe()
        .then(setUser)
        .catch(() => logout())
        .finally(() => setChecking(false));
    }
  }, []);

  useEffect(() => {
    getLanding()
      .then(setLanding)
      .catch(() => setLanding({ faixa: null, banners: [], planos: [] }))
      .finally(() => setLoadingLanding(false));
  }, []);

  if (checking && isAuthenticated()) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing">
      <LandingTopBar faixa={landing?.faixa} />
      <LandingHeader />
      {loadingLanding ? (
        <div className="landing-loading">Carregando...</div>
      ) : (
        <>
          <LandingHeroCarousel banners={landing?.banners} />
          <LandingSocialProof />
          <LandingStats />
          <LandingPlansCarousel planos={landing?.planos} />
          <LandingFeatures />
          <LandingHowItWorks />
          <LandingFaq />
        </>
      )}
      <LandingFooter />
    </div>
  );
}
