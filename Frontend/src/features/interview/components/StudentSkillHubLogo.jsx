import React from 'react';

/**
 * StudentSkillHub Brand Logo Component
 * - Concept: Graduation Cap / Open Book + Connected Skill Nodes
 * - Purple to Blue Controlled Gradient (#7C3AED -> #2563EB)
 * - Scalable vector SVG with optional Wordmark and Tagline
 * 
 * @param {Object} props
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size='md'] Size preset
 * @param {boolean} [props.showWordmark=true] Whether to display 'StudentSkillHub' text
 * @param {boolean} [props.showTagline=false] Whether to display 'Learn. Practice. Build. Get Hired.'
 * @param {string} [props.className=''] Additional custom CSS class
 */
export const StudentSkillHubLogo = ({
    size = 'md',
    showWordmark = true,
    showTagline = false,
    className = ''
}) => {
    const sizeDimensions = {
        xs: { icon: 20, font: '0.95rem', tag: '0.65rem' },
        sm: { icon: 24, font: '1.05rem', tag: '0.7rem' },
        md: { icon: 32, font: '1.25rem', tag: '0.75rem' },
        lg: { icon: 42, font: '1.55rem', tag: '0.825rem' },
        xl: { icon: 54, font: '2rem', tag: '0.925rem' }
    };

    const currentSize = sizeDimensions[size] || sizeDimensions.md;

    return (
        <div
            className={`ssh-brand-logo ssh-brand-logo--${size} ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                textDecoration: 'none'
            }}
        >
            {/* SVG Brand Icon: Graduation Cap + Connected Skill Nodes */}
            <div
                className="ssh-icon-wrapper"
                style={{
                    width: currentSize.icon + 10,
                    height: currentSize.icon + 10,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.16) 0%, rgba(37, 99, 235, 0.16) 100%)',
                    border: '1px solid rgba(124, 58, 237, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 0 16px rgba(124, 58, 237, 0.22)'
                }}
            >
                <svg
                    width={currentSize.icon}
                    height={currentSize.icon}
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="sshGradCap" x1="4" y1="8" x2="44" y2="40" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#A855F7" />
                            <stop offset="50%" stopColor="#7C3AED" />
                            <stop offset="100%" stopColor="#2563EB" />
                        </linearGradient>
                        <linearGradient id="sshGradNodes" x1="12" y1="28" x2="36" y2="44" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#38BDF8" />
                            <stop offset="100%" stopColor="#818CF8" />
                        </linearGradient>
                    </defs>

                    {/* Graduation Cap Diamond */}
                    <path
                        d="M24 6L42 15L24 24L6 15L24 6Z"
                        fill="url(#sshGradCap)"
                        stroke="#C084FC"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />

                    {/* Cap Base Arch */}
                    <path
                        d="M12 18.5V27.5C12 32.5 17.5 35 24 35C30.5 35 36 32.5 36 27.5V18.5"
                        stroke="url(#sshGradCap)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                    />

                    {/* Cap Tassel */}
                    <path
                        d="M38 17V26C38 27 39 28 40 28"
                        stroke="#F59E0B"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    <circle cx="40" cy="28.5" r="1.5" fill="#F59E0B" />

                    {/* Connected Skill Nodes (Orbital Network representing Skills & Career Bridge) */}
                    <line x1="15" y1="40" x2="24" y2="35" stroke="url(#sshGradNodes)" strokeWidth="1.6" strokeDasharray="2 2" />
                    <line x1="33" y1="40" x2="24" y2="35" stroke="url(#sshGradNodes)" strokeWidth="1.6" strokeDasharray="2 2" />
                    <line x1="15" y1="40" x2="33" y2="40" stroke="url(#sshGradNodes)" strokeWidth="1.4" />

                    {/* Skill Nodes */}
                    <circle cx="15" cy="40" r="3.2" fill="#38BDF8" />
                    <circle cx="15" cy="40" r="1.4" fill="#FFFFFF" />

                    <circle cx="24" cy="35" r="2.8" fill="#818CF8" />
                    <circle cx="24" cy="35" r="1.2" fill="#FFFFFF" />

                    <circle cx="33" cy="40" r="3.2" fill="#60A5FA" />
                    <circle cx="33" cy="40" r="1.4" fill="#FFFFFF" />
                </svg>
            </div>

            {/* Wordmark & Tagline */}
            {(showWordmark || showTagline) && (
                <div
                    className="ssh-brand-text-block"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        lineHeight: 1.15
                    }}
                >
                    {showWordmark && (
                        <div
                            className="ssh-brand-name"
                            style={{
                                fontSize: currentSize.font,
                                fontWeight: 800,
                                letterSpacing: '-0.025em',
                                color: '#F8FAFC',
                                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                            }}
                        >
                            Student<span style={{
                                background: 'linear-gradient(135deg, #A855F7 0%, #38BDF8 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>SkillHub</span>
                        </div>
                    )}

                    {showTagline && (
                        <span
                            className="ssh-brand-tagline"
                            style={{
                                fontSize: currentSize.tag,
                                fontWeight: 600,
                                color: '#94A3B8',
                                letterSpacing: '0.01em',
                                marginTop: '0.2rem'
                            }}
                        >
                            Learn. Practice. Build. Get Hired.
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentSkillHubLogo;
