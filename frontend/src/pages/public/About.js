import React from 'react';
import PublicLayout from '../../components/common/PublicLayout';
import Card from '../../components/common/Card';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  return (
    <PublicLayout>
      <div className="about">
        {/* Hero Section */}
        <div className="about-hero">
          <h1>About the Journal</h1>
          <p className="hero-subtitle">
            Journal of Pundra University of Science & Technology
          </p>
        </div>

        {/* Mission & Scope */}
        <Card className="section-card">
          <h2>
            <i className="fas fa-bullseye"></i> Mission & Scope
          </h2>
          <p className="section-text">
            The <strong>Journal of Pundra University of Science & Technology (JPUST)</strong> is a 
            peer-reviewed, open-access academic journal dedicated to publishing high-quality research 
            across all disciplines of Science, Technology, Engineering, and Mathematics (STEM).
          </p>
          <p className="section-text">
            Our mission is to advance scientific knowledge by providing a platform for researchers, 
            students, and faculty to share their findings with the global academic community. We are 
            committed to maintaining the highest standards of academic integrity, rigorous peer review, 
            and ethical publishing practices.
          </p>
          <div className="scope-areas">
            <h3>Areas of Focus</h3>
            <div className="areas-grid">
              <div className="area-item">
                <i className="fas fa-atom"></i>
                <h4>Physical Sciences</h4>
                <p>Physics, Chemistry, Earth Sciences</p>
              </div>
              <div className="area-item">
                <i className="fas fa-dna"></i>
                <h4>Life Sciences</h4>
                <p>Biology, Biochemistry, Biotechnology</p>
              </div>
              <div className="area-item">
                <i className="fas fa-laptop-code"></i>
                <h4>Computer Science</h4>
                <p>AI, Data Science, Software Engineering</p>
              </div>
              <div className="area-item">
                <i className="fas fa-cogs"></i>
                <h4>Engineering</h4>
                <p>Mechanical, Civil, Electrical, Chemical</p>
              </div>
              <div className="area-item">
                <i className="fas fa-calculator"></i>
                <h4>Mathematics</h4>
                <p>Pure & Applied Mathematics, Statistics</p>
              </div>
              <div className="area-item">
                <i className="fas fa-vial"></i>
                <h4>Applied Sciences</h4>
                <p>Materials Science, Environmental Science</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Editorial Board */}
        <Card className="section-card">
          <h2>
            <i className="fas fa-users"></i> Editorial Board
          </h2>
          <p className="section-text">
            Our distinguished editorial board consists of leading experts from various fields who 
            ensure the quality and integrity of published research.
          </p>
          
          <div className="board-section">
            <h3>Editor-in-Chief</h3>
            <div className="board-member">
              <div className="member-avatar">
                <i className="fas fa-user-tie"></i>
              </div>
              <div className="member-info">
                <h4>Dr. [Name]</h4>
                <p>Professor of [Department]</p>
                <p className="affiliation">Pundra University of Science & Technology</p>
                <p className="member-email">
                  <i className="fas fa-envelope"></i> editor@pundra.edu
                </p>
              </div>
            </div>
          </div>

          <div className="board-section">
            <h3>Associate Editors</h3>
            <div className="board-members-grid">
              {[
                { name: 'Dr. [Name]', field: 'Physical Sciences', dept: 'Department of Physics' },
                { name: 'Dr. [Name]', field: 'Computer Science', dept: 'Department of CSE' },
                { name: 'Dr. [Name]', field: 'Engineering', dept: 'Department of Mechanical Engineering' },
                { name: 'Dr. [Name]', field: 'Life Sciences', dept: 'Department of Biology' }
              ].map((member, index) => (
                <div key={index} className="board-member-card">
                  <div className="member-avatar-sm">
                    <i className="fas fa-user"></i>
                  </div>
                  <h4>{member.name}</h4>
                  <p className="field">{member.field}</p>
                  <p className="dept">{member.dept}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Publication Process */}
        <Card className="section-card">
          <h2>
            <i className="fas fa-project-diagram"></i> Publication Process
          </h2>
          <p className="section-text">
            We maintain a rigorous, transparent peer-review process to ensure the quality of 
            published research.
          </p>
          
          <div className="process-timeline">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Submission</h4>
                <p>Authors submit manuscripts through our online portal</p>
              </div>
            </div>
            
            <div className="process-arrow">
              <i className="fas fa-arrow-down"></i>
            </div>
            
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Initial Review</h4>
                <p>Editor-in-Chief performs preliminary screening</p>
              </div>
            </div>
            
            <div className="process-arrow">
              <i className="fas fa-arrow-down"></i>
            </div>
            
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Peer Review</h4>
                <p>Minimum 2 expert reviewers evaluate the manuscript</p>
              </div>
            </div>
            
            <div className="process-arrow">
              <i className="fas fa-arrow-down"></i>
            </div>
            
            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Editorial Decision</h4>
                <p>Accept, Reject, or Request Revisions</p>
              </div>
            </div>
            
            <div className="process-arrow">
              <i className="fas fa-arrow-down"></i>
            </div>
            
            <div className="process-step">
              <div className="step-number">5</div>
              <div className="step-content">
                <h4>Publication</h4>
                <p>Accepted papers are published with DOI assignment</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Open Access Policy */}
        <Card className="section-card">
          <h2>
            <i className="fas fa-unlock-alt"></i> Open Access Policy
          </h2>
          <p className="section-text">
            JPUST is committed to open access publishing. All articles are freely available to 
            readers worldwide immediately upon publication, promoting the widest possible dissemination 
            of research findings.
          </p>
          
          <div className="policy-features">
            <div className="feature-item">
              <i className="fas fa-check-circle"></i>
              <div>
                <h4>Free to Read</h4>
                <p>No subscription or paywall barriers</p>
              </div>
            </div>
            <div className="feature-item">
              <i className="fas fa-check-circle"></i>
              <div>
                <h4>CC BY License</h4>
                <p>Authors retain copyright with Creative Commons Attribution</p>
              </div>
            </div>
            <div className="feature-item">
              <i className="fas fa-check-circle"></i>
              <div>
                <h4>No Author Fees</h4>
                <p>Currently free for authors to publish</p>
              </div>
            </div>
            <div className="feature-item">
              <i className="fas fa-check-circle"></i>
              <div>
                <h4>DOI Assignment</h4>
                <p>Permanent identifier for each published article</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Publication Ethics */}
        <Card className="section-card">
          <h2>
            <i className="fas fa-balance-scale"></i> Publication Ethics
          </h2>
          <p className="section-text">
            JPUST adheres to the highest standards of publication ethics as outlined by the 
            Committee on Publication Ethics (COPE).
          </p>
          
          <div className="ethics-grid">
            <div className="ethics-item">
              <i className="fas fa-user-secret"></i>
              <h4>Double-Blind Review</h4>
              <p>Author and reviewer identities are kept confidential</p>
            </div>
            <div className="ethics-item">
              <i className="fas fa-ban"></i>
              <h4>Zero Plagiarism</h4>
              <p>All submissions are screened for plagiarism</p>
            </div>
            <div className="ethics-item">
              <i className="fas fa-handshake"></i>
              <h4>Conflict of Interest</h4>
              <p>Authors must declare any conflicts of interest</p>
            </div>
            <div className="ethics-item">
              <i className="fas fa-recycle"></i>
              <h4>Data Sharing</h4>
              <p>We encourage transparent data sharing practices</p>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="section-card contact-section">
          <h2>
            <i className="fas fa-envelope"></i> Contact Us
          </h2>
          
          <div className="contact-grid">
            <div className="contact-item">
              <i className="fas fa-building"></i>
              <div>
                <h4>Postal Address</h4>
                <p>
                  Journal Editorial Office<br />
                  Pundra University of Science & Technology<br />
                  [Address Line 1]<br />
                  [City, Postal Code]<br />
                  Bangladesh
                </p>
              </div>
            </div>
            
            <div className="contact-item">
              <i className="fas fa-at"></i>
              <div>
                <h4>Email</h4>
                <p>
                  <strong>Editorial Inquiries:</strong><br />
                  <a href="mailto:editor@journal.pundra.edu">editor@journal.pundra.edu</a>
                </p>
                <p>
                  <strong>Technical Support:</strong><br />
                  <a href="mailto:support@journal.pundra.edu">support@journal.pundra.edu</a>
                </p>
              </div>
            </div>
            
            <div className="contact-item">
              <i className="fas fa-globe"></i>
              <div>
                <h4>Website</h4>
                <p>
                  <a href="https://www.pundra.edu" target="_blank" rel="noopener noreferrer">
                    www.pundra.edu
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Call to Action */}
        <div className="cta-section">
          <h2>Ready to Submit Your Research?</h2>
          <p>Join our community of researchers and contribute to advancing scientific knowledge</p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary btn-lg">
              <i className="fas fa-upload"></i> Submit Manuscript
            </Link>
            <Link to="/search" className="btn btn-outline btn-lg">
              <i className="fas fa-search"></i> Browse Articles
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default About;