import React, { useEffect, useState, useRef } from "react";
import "../CSS/HomePage.css";
import { useNavigate, Link } from "react-router-dom";
import { FiMenu, FiX, FiPhone, FiMail, FiMapPin, FiTrendingUp, FiShoppingCart, FiStar, FiSmile, FiCamera, FiCheckCircle, FiBell, FiGrid, FiUsers, FiCloud, FiPackage, FiAward } from "react-icons/fi";
import { motion, useInView } from "framer-motion";
import missionImage from '../Images/mission.jpeg';
// About Scroll Stack Component - Modern Lightweight Design
const AboutScrollStack = () => {
  const sections = [
    {
      id: 1,
      title: "Our Mission",
      subtitle: "Revolutionizing Aquaculture",
      description: "To revolutionize the aquaculture industry by delivering sustainable, healthy, and profitable solutions for shrimp and prawn farmers across the nation.",
      image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=1200&auto=format&fit=crop",
      icon: <FiTrendingUp />,
      highlights: [
        "Sustainable aquaculture practices",
        "Healthy & profitable solutions",
        "Supporting farmers nationwide"
      ],
      quote: "Hey boss, don't just buy any random seed - with us, you get Healthy Seeds, High Profits."
    },
    {
      id: 2,
      title: "Our Vision",
      subtitle: "Global Excellence",
      description: "To be recognized as a trusted global brand in the hatchery industry, promoting eco-friendly aquaculture practices and supporting farmers with reliable and result-driven seed quality.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop",
      icon: <FiStar />,
      highlights: [
        "Trusted global brand",
        "Eco-friendly practices",
        "Result-driven quality"
      ]
    },
    {
      id: 3,
      title: "Core Values",
      subtitle: "Trust, Transparency, Technology",
      description: "We are built on the foundation of trust, transparency, and technology. These three pillars guide every decision we make and every seed we produce.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop",
      icon: <FiCheckCircle />,
      highlights: [
        "Trust - Building lasting relationships",
        "Transparency - Open and honest practices",
        "Technology - Innovation in aquaculture"
      ]
    },
    {
      id: 4,
      title: "Expert Team",
      subtitle: "World-Class Professionals",
      description: "Our team of aquaculture experts ensures every stage, from broodstock selection to larval rearing, follows world-class biosecurity and water quality standards.",
      image: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?q=80&w=1200&auto=format&fit=crop",
      icon: <FiUsers />,
      highlights: [
        "Experienced aquaculture professionals",
        "World-class biosecurity standards",
        "Dedicated to farmer success"
      ],
      quote: "Because here, we believe in raising prawns, not problems."
    }
  ];

  return (
    <div className="about-scroll-stack">
      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          className={`stack-card stack-card-${section.id}`}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: index * 0.15 }}
        >
          <div className={`stack-card-inner ${index % 2 === 1 ? 'reverse' : ''}`}>
            <div className="stack-card-content">
              <div className="stack-number">{String(section.id).padStart(2, '0')}</div>
              <div className="stack-icon">{section.icon}</div>
              <h3 className="stack-title">{section.title}</h3>
              <p className="stack-subtitle">{section.subtitle}</p>
              <p className="stack-description">{section.description}</p>

              <ul className="stack-highlights">
                {section.highlights.map((highlight, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 + i * 0.1 }}
                  >
                    <FiCheckCircle className="check-icon" />
                    <span>{highlight}</span>
                  </motion.li>
                ))}
              </ul>

              {section.quote && (
                <blockquote className="stack-quote">
                  "{section.quote}"
                </blockquote>
              )}
            </div>

            <motion.div
              className="stack-card-image"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="image-glow"></div>
              <img src={section.image} alt={section.title} loading="lazy" />
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  // Counter animation state
  const [countersStarted, setCountersStarted] = useState(false);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true });

  // Ensure light mode is always applied
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("lords-dark");
    root.classList.add("lords-light");
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (statsInView && !countersStarted) {
      setCountersStarted(true);
    }
  }, [statsInView, countersStarted]);

  // Preload video for better performance
  useEffect(() => {
    const video = document.createElement('video');
    video.src = '/hero_section.mp4';
    video.preload = 'metadata';
    video.muted = true;
    
    const handleCanPlay = () => {
      setVideoLoaded(true);
    };
    
    video.addEventListener('canplaythrough', handleCanPlay);
    
    return () => {
      video.removeEventListener('canplaythrough', handleCanPlay);
    };
  }, []);


  // Counter animation component
  const Counter = ({ end, duration = 2000, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!countersStarted) return;

      let startTime;
      let animationFrame;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percentage = Math.min(progress / duration, 1);

        const easeOutQuart = 1 - Math.pow(1 - percentage, 4);
        setCount(Math.floor(end * easeOutQuart));

        if (percentage < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }, [countersStarted, end, duration]);

    return <span>{count.toLocaleString()}{suffix}</span>;
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileOpen(false);
    }
  };

  // Handle contact form submission
  const handleContactFormSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = {
      name: form.querySelector('#contact-name').value,
      phone: form.querySelector('#contact-phone').value,
      email: form.querySelector('#contact-email').value,
      subject: form.querySelector('#contact-subject').value,
      message: form.querySelector('#contact-message').value
    };

    // Create email body
    const emailSubject = encodeURIComponent(`Contact Form: ${formData.subject}`);
    const emailBody = encodeURIComponent(
      `Name: ${formData.name}\n` +
      `Phone: ${formData.phone}\n` +
      `Email: ${formData.email}\n` +
      `Subject: ${formData.subject}\n\n` +
      `Message:\n${formData.message}`
    );

    // Create WhatsApp message
    const whatsappMessage = encodeURIComponent(
      `Hello! I'm ${formData.name}.\n\n` +
      `Phone: ${formData.phone}\n` +
      `Email: ${formData.email}\n` +
      `Subject: ${formData.subject}\n\n` +
      `${formData.message}`
    );

    // Open email client
    window.location.href = `mailto:mojeshbondu1@gmail.com?subject=${emailSubject}&body=${emailBody}`;

    // Also open WhatsApp in a new tab (optional - user can choose)
    setTimeout(() => {
      window.open(`https://wa.me/919701308016?text=${whatsappMessage}`, '_blank');
    }, 500);

    // Reset form
    form.reset();
    alert('Thank you for your message! We have opened your email client and WhatsApp. Please send the message to contact us.');
  };


  return (
    <div className="lords-root">
      {/* FLOATING NAVBAR */}
      <header className={`lords-navbar ${scrolled ? "lords-navbar--scrolled" : ""}`}>
        <div className="lords-container lords-navbar-inner">
          <div className="lords-brand">
            <Link to="/" className="lords-brand-link">
              <img src="/logo.png" alt="Lords Aqua Hatcheries" className="lords-logo" />
              <div className="lords-brand-text">
                <span className="lords-brand-title">Lords Aqua Hatcheries</span>
              </div>
            </Link>
          </div>

          <nav className="lords-nav-desktop">
            <button onClick={() => scrollToSection("about")} className="lords-nav-link">About</button>
            <button onClick={() => scrollToSection("features")} className="lords-nav-link">Features</button>
            <button onClick={() => scrollToSection("contact")} className="lords-nav-link">Contact Us</button>

            <div className="lords-login-group">
              <button className="lords-btn lords-btn-outline" onClick={() => navigate("/user-login")}>For User</button>
              <button className="lords-btn lords-btn-primary" onClick={() => navigate("/admin-login")}>For Admin</button>
            </div>

          </nav>

          <div className="lords-nav-mobile">
            <button className="lords-icon-btn" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <div className={`lords-mobile-drawer ${mobileOpen ? "open" : ""}`}>
          <div className="lords-mobile-links">
            <button onClick={() => scrollToSection("about")}>About</button>
            <button onClick={() => scrollToSection("features")}>Features</button>
            <button onClick={() => scrollToSection("contact")}>Contact Us</button>
            <div className="lords-mobile-divider" />
            <button className="lords-btn lords-btn-outline block" onClick={() => { setMobileOpen(false); navigate("/user-login"); }}>For User</button>
            <button className="lords-btn lords-btn-primary block" onClick={() => { setMobileOpen(false); navigate("/admin-login"); }}>For Admin</button>
          </div>
        </div>
      </header>

      <main className="lords-main">
        {/* HERO SECTION */}
        <section className="lords-hero">
          <div className={`lords-hero-bg ${!videoLoaded ? 'loading' : ''}`}>
            <video 
              className="lords-hero-bg-video" 
              autoPlay 
              muted 
              loop 
              playsInline
              preload="metadata"
              data-loaded={videoLoaded}
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => setVideoLoaded(false)}
              style={{ opacity: videoLoaded ? 0.7 : 0 }}
            >
              <source src="/hero_section.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Fallback image for browsers that don't support video or while loading */}
            <img 
              src="/hatchery-pond.jpg" 
              alt="Hatchery Pond" 
              className="lords-hero-bg-image" 
              style={{ display: videoLoaded ? 'none' : 'block' }}
            />
         

            
          </div>

          <div className="lords-container lords-hero-content">
            <motion.div
              className="lords-hero-text"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="lords-hero-title">
                A New Vision in the Hatchery World
              </h1>
              <p className="lords-hero-subtitle">
                Redefining aquaculture with innovation, sustainability, and science to deliver healthy, high-quality prawn seeds for better yields and better profits.
              </p>
              <div className="lords-hero-ctas">
                <button className="lords-btn lords-btn-primary lords-btn-lg" onClick={() => navigate("/user-login")}>
                  Get Started
                </button>
                <button className="lords-btn lords-btn-outline lords-btn-lg" onClick={() => scrollToSection("features")}>
                  Learn More
                </button>
              </div>
            </motion.div>
          </div>

          {/* Animated wave decoration */}
          <div className="lords-wave">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="lords-wave-path"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="lords-wave-path"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="lords-wave-path"></path>
            </svg>
          </div>
        </section>

        {/* STATISTICS SECTION - CLEAN MODERN DESIGN */}
        <section className="lords-stats-clean" ref={statsRef}>
          <div className="lords-container-wide">
            <div className="lords-stats-row-clean">
              <motion.div
                className="lords-stat-clean"
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="stat-clean-icon-wrapper">
                  <FiTrendingUp className="stat-clean-icon" />
                </div>
                <div className="stat-clean-number">
                  {countersStarted ? <Counter end={250000} suffix="+" /> : "0"}
                </div>
                <div className="stat-clean-label">Total Seeds</div>
                <div className="stat-clean-bar"></div>
              </motion.div>

              <motion.div
                className="lords-stat-clean"
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="stat-clean-icon-wrapper">
                  <FiShoppingCart className="stat-clean-icon" />
                </div>
                <div className="stat-clean-number">
                  {countersStarted ? <Counter end={180000} suffix="+" /> : "0"}
                </div>
                <div className="stat-clean-label">Seeds Sold</div>
                <div className="stat-clean-bar"></div>
              </motion.div>

              <motion.div
                className="lords-stat-clean"
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="stat-clean-icon-wrapper">
                  <FiStar className="stat-clean-icon" />
                </div>
                <div className="stat-clean-number">
                  {countersStarted ? <><Counter end={4} suffix="." /><Counter end={8} /></> : "0"}
                </div>
                <div className="stat-clean-label">User Rating</div>
                <div className="stat-clean-bar"></div>
              </motion.div>

              <motion.div
                className="lords-stat-clean"
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="stat-clean-icon-wrapper">
                  <FiSmile className="stat-clean-icon" />
                </div>
                <div className="stat-clean-number">
                  {countersStarted ? <Counter end={500} suffix="+" /> : "0"}
                </div>
                <div className="stat-clean-label">Happy Clients</div>
                <div className="stat-clean-bar"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="lords-about-section">
          <div className="lords-container">
            <motion.div
              className="lords-section-header"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="lords-section-title">About Lords Aqua Hatcheries</h2>
              <p className="lords-section-subtitle">
                Built on trust, transparency, and technology - we're redefining aquaculture excellence
              </p>
            </motion.div>

            <AboutScrollStack />
          </div>
        </section>

        {/* FEATURES SECTION - COMPLETELY REVAMPED */}
        <section id="features" className="lords-features-section-new">
          <div className="lords-features-bg-gradient"></div>
          
          <div className="lords-container">
            <motion.div
              className="lords-features-header"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="lords-features-badge">Our Services</span>
              <h2 className="lords-features-main-title">What We Offer</h2>
              <p className="lords-features-main-subtitle">
                Premium quality prawn seeds and comprehensive support from hatch to harvest
              </p>
            </motion.div>

            <div className="lords-features-grid">
              {/* Feature Card 1 */}
              <motion.div
                className="lords-feature-card lords-feature-card-primary"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="lords-feature-card-glow"></div>
                <div className="lords-feature-number">01</div>
                <div className="lords-feature-icon-wrapper">
                  <div className="lords-feature-icon-bg"></div>
                  <FiCamera className="lords-feature-icon" />
                </div>
                <h3 className="lords-feature-card-title">Bio-Secure Hatchery Systems</h3>
                <p className="lords-feature-card-desc">
                  100% monitored and controlled environments ensuring disease-free, fast-growing, and high-survival-rate seeds for consistent success from hatch to harvest.
                </p>
              </motion.div>

              {/* Feature Card 2 */}
              <motion.div
                className="lords-feature-card lords-feature-card-secondary"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="lords-feature-card-glow"></div>
                <div className="lords-feature-number">02</div>
                <div className="lords-feature-icon-wrapper">
                  <div className="lords-feature-icon-bg"></div>
                  <FiUsers className="lords-feature-icon" />
                </div>
                <h3 className="lords-feature-card-title">Expert Guidance & Support</h3>
                <p className="lords-feature-card-desc">
                  Technical support from experienced aquaculture professionals throughout the growing cycle, ensuring healthy ponds, faster growth, and profitable harvests.
                </p>
              </motion.div>

              {/* Feature Card 3 */}
              <motion.div
                className="lords-feature-card lords-feature-card-accent"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="lords-feature-card-glow"></div>
                <div className="lords-feature-number">03</div>
                <div className="lords-feature-icon-wrapper">
                  <div className="lords-feature-icon-bg"></div>
                  <FiCloud className="lords-feature-icon" />
                </div>
                <h3 className="lords-feature-card-title">Sustainable Practices</h3>
                <p className="lords-feature-card-desc">
                  Responsible and eco-conscious farming from hatch to harvest. Year-round production capacity with world-class biosecurity and water quality standards.
                </p>
              </motion.div>

              {/* Feature Card 4 */}
              <motion.div
                className="lords-feature-card lords-feature-card-success"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="lords-feature-card-glow"></div>
                <div className="lords-feature-number">04</div>
                <div className="lords-feature-icon-wrapper">
                  <div className="lords-feature-icon-bg"></div>
                  <FiStar className="lords-feature-icon" />
                </div>
                <h3 className="lords-feature-card-title">High-Quality Prawn Seeds</h3>
                <p className="lords-feature-card-desc">
                  Uniform size, fast growth, and strong survival rate. Every seed is bred, tested, and nurtured with care and precision for maximum results. Healthy Seeds, High Profits.
                </p>
              </motion.div>

              {/* Feature Card 5 */}
              <motion.div
                className="lords-feature-card lords-feature-card-info"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="lords-feature-card-glow"></div>
                <div className="lords-feature-number">05</div>
                <div className="lords-feature-icon-wrapper">
                  <div className="lords-feature-icon-bg"></div>
                  <FiPackage className="lords-feature-icon" />
                </div>
                <h3 className="lords-feature-card-title">Consistent Supply</h3>
                <p className="lords-feature-card-desc">
                  Year-round production capacity means you get reliable seed supply whenever you need it. We ensure you never face stock shortages during critical farming seasons.
                </p>
              </motion.div>

              {/* Feature Card 6 */}
              <motion.div
                className="lords-feature-card lords-feature-card-warning"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="lords-feature-card-glow"></div>
                <div className="lords-feature-number">06</div>
                <div className="lords-feature-icon-wrapper">
                  <div className="lords-feature-icon-bg"></div>
                  <FiAward className="lords-feature-icon" />
                </div>
                <h3 className="lords-feature-card-title">Proven Track Record</h3>
                <p className="lords-feature-card-desc">
                  Join hundreds of successful farmers who trust us for their aquaculture needs. Our results speak for themselves with higher survival rates and better harvest outcomes.
                </p>
              </motion.div>
            </div>

          </div>
        </section>

        {/* CONTACT SECTION - MODERN SPLIT LAYOUT */}
        <section id="contact" className="lords-contact-section-new">
          <div className="contact-split-container">
            {/* Left Side - Contact Info */}
            <motion.div
              className="contact-info-side"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="contact-info-content">
                <span className="contact-badge">Get In Touch</span>
                <h2 className="contact-main-title">Let's Start a Conversation</h2>
                <p className="contact-main-subtitle">
                  Have questions about our prawn seeds or aquaculture services? We're here to help you succeed.
                </p>

                {/* Contact Methods */}
                <div className="contact-methods">
                  <motion.div
                    className="contact-method-item"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ x: 8 }}
                  >
                    <div className="method-icon">
                      <FiPhone />
                    </div>
                    <div className="method-details">
                      <h4>Phone</h4>
                      <a href="tel:+919701308016">+91 97013 08016</a>
                    </div>
                  </motion.div>

                  <motion.div
                    className="contact-method-item"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ x: 8 }}
                  >
                    <div className="method-icon">
                      <FiMail />
                    </div>
                    <div className="method-details">
                      <h4>Email</h4>
                      <a href="mailto:mojeshbondu1@gmail.com">mojeshbondu1@gmail.com</a>
                    </div>
                  </motion.div>

                  <motion.div
                    className="contact-method-item"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ x: 8 }}
                  >
                    <div className="method-icon">
                      <FiMapPin />
                    </div>
                    <div className="method-details">
                      <h4>Visit Us</h4>
                      <p>Vemavaram, Tuni Coast</p>
                      <p>Andhra Pradesh, 533401</p>
                    </div>
                  </motion.div>
                </div>

                {/* Business Hours */}
                <motion.div
                  className="business-hours"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <h4>Business Hours</h4>
                  <div className="hours-grid">
                    <div className="hour-item">
                      <span className="day">Monday - Friday</span>
                      <span className="time">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="hour-item">
                      <span className="day">Saturday</span>
                      <span className="time">10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="hour-item">
                      <span className="day">Sunday</span>
                      <span className="time">Closed</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Side - Quick Contact Form */}
            <motion.div
              className="contact-form-side"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="contact-form-container">
                <h3 className="form-title">Send us a Message</h3>
                <p className="form-subtitle">Fill out the form and we'll get back to you within 24 hours</p>

                <form className="modern-contact-form" onSubmit={handleContactFormSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="contact-name">
                        <FiUsers size={16} />
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="contact-name"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="contact-phone">
                        <FiPhone size={16} />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="contact-phone"
                        placeholder="+91 97013 08016"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-email">
                      <FiMail size={16} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="contact-email"
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-subject">
                      <FiCheckCircle size={16} />
                      Subject
                    </label>
                    <select id="contact-subject" required>
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="bulk">Bulk Order</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-message">
                      <FiMail size={16} />
                      Your Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows="5"
                      placeholder="Tell us how we can help you..."
                      required
                    ></textarea>
                  </div>

                  <motion.button
                    type="submit"
                    className="contact-submit-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Send Message</span>
                    <FiTrendingUp size={20} />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </section>

        {/* OUR PROMISE SECTION - REDESIGNED */}
        <section className="promise-section-new">
          <div className="promise-container">
            <div className="promise-content-wrapper">
              {/* Left - Image Side */}
              <motion.div
                className="promise-image-side"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="promise-image-stack">
                  <div className="promise-img-card promise-img-1">
                    <img src="https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=800&auto=format&fit=crop" alt="Quality Seeds" />
                  </div>
                  <div className="promise-img-card promise-img-2">
                    <img src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop" alt="Healthy Harvest" />
                  </div>
                  <div className="promise-badge">
                    <FiAward size={32} />
                    <span>Certified Excellence</span>
                  </div>
                </div>
              </motion.div>

              {/* Right - Content Side */}
              <motion.div
                className="promise-text-side"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <span className="promise-label">Our Commitment</span>
                <h2 className="promise-title">Our Promise to You</h2>
                <p className="promise-description">
                  We understand that your success depends on the quality of your seed. That's why every seed from <strong>Lords Aqua Hatcheries</strong> is bred, tested, and nurtured with care and precision to help you harvest more, faster, and healthier.
                </p>

                <div className="promise-features">
                  <motion.div
                    className="promise-feature-item"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="feature-icon-promise">
                      <FiCheckCircle />
                    </div>
                    <div className="feature-text-promise">
                      <h4>Quality Assurance</h4>
                      <p>Every seed tested for optimal health and survival rates</p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="promise-feature-item"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="feature-icon-promise">
                      <FiTrendingUp />
                    </div>
                    <div className="feature-text-promise">
                      <h4>Continuous Support</h4>
                      <p>Expert guidance throughout your growing cycle</p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="promise-feature-item"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="feature-icon-promise">
                      <FiStar />
                    </div>
                    <div className="feature-text-promise">
                      <h4>Proven Results</h4>
                      <p>Higher yields and better profits for our farmers</p>
                    </div>
                  </motion.div>
                </div>

                <div className="promise-quote-box">
                  <FiCloud className="quote-icon" />
                  <p className="promise-quote-text">"From hatch to harvest, sustainable aquaculture."</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>


        {/* DOWNLOAD APP SECTION */}
        <section className="lords-download-section">
          <div className="lords-container">
            <motion.div
              className="lords-download-card"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="lords-download-content">
                <h2 className="lords-download-title">We Are Available At Your Fingertips</h2>
                <p className="lords-download-subtitle">
                  Track your hatchery progress, get real-time updates, connect with experts, and manage your aquaculture journey - all from the palm of your hand. Download the Lord's Aqua Hatcheries app and experience aquaculture excellence on the go.
                </p>
                <div className="lords-app-features">
                  <div className="lords-app-feature-item">
                    <FiCamera />
                    <span>Daily Progress Tracking</span>
                  </div>
                  <div className="lords-app-feature-item">
                    <FiBell />
                    <span>Instant Notifications</span>
                  </div>
                  <div className="lords-app-feature-item">
                    <FiUsers />
                    <span>Expert Support 24/7</span>
                  </div>
                </div>
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lords-playstore-btn"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" />
                </a>
              </div>
              <div className="lords-download-image">
                <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&auto=format&fit=crop" alt="Mobile App" />
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="lords-footer">
        <div className="lords-container">
          <div className="lords-footer-content">
            <div className="lords-footer-left">
              <div className="lords-footer-logo">
                <img src="/logo.png" alt="Lords Aqua Hatcheries" />
                <span>Lords Aqua Hatcheries</span>
              </div>
              <p className="lords-footer-desc">
                "From hatch to harvest, sustainable aquaculture" - Your trusted partner for healthy seeds and high profits.
              </p>
              <p className="lords-copyright">
                © {new Date().getFullYear()} Lords Aqua Hatcheries. All rights reserved.
              </p>
            </div>

            <div className="lords-footer-links">
              <div className="lords-footer-col">
                <h4>Quick Links</h4>
                <button onClick={() => scrollToSection("about")}>About</button>
                <button onClick={() => scrollToSection("features")}>Features</button>
                <button onClick={() => scrollToSection("contact")}>Contact</button>
              </div>

              <div className="lords-footer-col">
                <h4>Account</h4>
                <Link to="/user-login">User Login</Link>
                <Link to="/admin-login">Admin Login</Link>
              </div>

              <div className="lords-footer-col">
                <h4>Legal</h4>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/919701308016"
        target="_blank"
        rel="noopener noreferrer"
        className="lords-whatsapp-float"
        aria-label="Contact us on WhatsApp"
      >
        <svg viewBox="0 0 32 32" fill="currentColor">
          <path d="M16 0C7.164 0 0 7.163 0 16c0 2.825.739 5.607 2.137 8.048L.393 30.25c-.138.413.281.83.693.69l6.202-1.743A15.926 15.926 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333c-2.61 0-5.147-.764-7.333-2.208l-.415-.273-4.32 1.214 1.214-4.32-.273-.415A13.25 13.25 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.81-10.03c-.427-.213-2.528-1.247-2.92-1.39-.392-.143-.677-.213-.963.214-.285.427-1.105 1.39-1.355 1.676-.25.285-.498.321-.925.107-.427-.214-1.802-.664-3.432-2.117-1.268-1.132-2.125-2.53-2.375-2.957-.25-.427-.027-.658.187-.87.192-.192.427-.498.64-.748.214-.25.285-.427.427-.712.143-.285.072-.535-.035-.748-.107-.214-.963-2.32-1.32-3.177-.348-.835-.7-.722-.963-.735-.25-.013-.535-.016-.82-.016s-.748.107-1.14.535c-.392.427-1.498 1.462-1.498 3.568s1.533 4.137 1.747 4.423c.214.285 3.01 4.595 7.293 6.444 1.018.44 1.813.703 2.432.9.1.032 1.906.611 2.175.611.269 0 .537-.174.675-.327.138-.153.69-.845.69-1.645 0-.8-.138-1.428-.507-1.645z"/>
        </svg>
      </a>
    </div>
  );
};

export default HomePage;
