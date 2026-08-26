import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import '../style/targetSwitcher.scss';

/**
 * Score Color Helper
 */
const getScoreColorClass = (score) => {
    if (typeof score !== 'number' || score <= 0) return 'score-badge--none';
    if (score >= 75) return 'score-badge--high';
    if (score >= 50) return 'score-badge--med';
    return 'score-badge--low';
};

/**
 * Custom Viewport-Aware Target Switcher Dropdown
 */
export const TargetSwitcher = ({
    primaryJourney,
    otherJourneys = [],
    onSwitchJourney,
    isSwitching = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const [openUpward, setOpenUpward] = useState(false);

    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const optionsRef = useRef([]);
    const listboxId = useId();

    // Deduplicate journeys list by _id
    const uniqueJourneys = React.useMemo(() => {
        const seen = new Set();
        const list = [];
        if (otherJourneys && Array.isArray(otherJourneys)) {
            otherJourneys.forEach(j => {
                if (j && j._id && !seen.has(j._id.toString())) {
                    seen.add(j._id.toString());
                    list.push(j);
                }
            });
        }
        return list;
    }, [otherJourneys]);

    // Position calculation
    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const isMobile = viewportWidth < 600;
        const width = isMobile ? Math.min(viewportWidth - 24, 420) : Math.min(420, viewportWidth - 32);

        // Horizontal alignment (align right of trigger, or clamp within screen)
        let left = triggerRect.right - width;
        if (left < 12) left = 12;
        if (left + width > viewportWidth - 12) left = viewportWidth - width - 12;

        // Vertical space calculation
        const spaceBelow = viewportHeight - triggerRect.bottom - 12;
        const spaceAbove = triggerRect.top - 12;
        const shouldOpenUpward = spaceBelow < 240 && spaceAbove > spaceBelow;

        setOpenUpward(shouldOpenUpward);

        if (isMobile) {
            // On mobile, render anchored cleanly
            setDropdownStyle({
                position: 'fixed',
                left: `${left}px`,
                width: `${width}px`,
                top: shouldOpenUpward ? 'auto' : `${triggerRect.bottom + 8}px`,
                bottom: shouldOpenUpward ? `${viewportHeight - triggerRect.top + 8}px` : 'auto',
                maxHeight: shouldOpenUpward ? `${Math.min(360, spaceAbove)}px` : `${Math.min(360, spaceBelow)}px`,
                zIndex: 99999
            });
        } else {
            setDropdownStyle({
                position: 'fixed',
                left: `${left}px`,
                width: `${width}px`,
                top: shouldOpenUpward ? 'auto' : `${triggerRect.bottom + 8}px`,
                bottom: shouldOpenUpward ? `${viewportHeight - triggerRect.top + 8}px` : 'auto',
                maxHeight: shouldOpenUpward ? `${Math.min(380, spaceAbove)}px` : `${Math.min(380, spaceBelow)}px`,
                zIndex: 99999
            });
        }
    }, []);

    // Toggle dropdown
    const handleToggle = () => {
        if (isSwitching) return;
        if (!isOpen) {
            updatePosition();
            setIsOpen(true);
            // Focus active index
            const currentIdx = uniqueJourneys.findIndex(j => j._id === primaryJourney?._id);
            setFocusedIndex(currentIdx >= 0 ? currentIdx : 0);
        } else {
            setIsOpen(false);
        }
    };

    // Close on click outside or escape
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(e.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.key === 'Tab') {
                setIsOpen(false);
                triggerRef.current?.focus();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex(prev => {
                    const next = prev < uniqueJourneys.length - 1 ? prev + 1 : 0;
                    optionsRef.current[next]?.scrollIntoView({ block: 'nearest' });
                    return next;
                });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex(prev => {
                    const next = prev > 0 ? prev - 1 : uniqueJourneys.length - 1;
                    optionsRef.current[next]?.scrollIntoView({ block: 'nearest' });
                    return next;
                });
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < uniqueJourneys.length) {
                    handleSelectJourney(uniqueJourneys[focusedIndex]._id);
                }
            }
        };

        const handleScrollOrResize = () => {
            updatePosition();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleScrollOrResize);
        window.addEventListener('scroll', handleScrollOrResize, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [isOpen, focusedIndex, uniqueJourneys, updatePosition]);

    // Select journey handler
    const handleSelectJourney = async (journeyId) => {
        if (isSwitching) return;
        if (journeyId === primaryJourney?._id) {
            setIsOpen(false);
            return;
        }
        setIsOpen(false);
        if (onSwitchJourney) {
            await onSwitchJourney(journeyId);
        }
    };

    const currentRole = primaryJourney?.targetRole || 'Select Target';
    const currentScore = typeof primaryJourney?.matchScore === 'number' ? primaryJourney.matchScore : 0;

    return (
        <div className="target-switcher-wrapper">
            {/* ── Trigger Button ── */}
            <button
                ref={triggerRef}
                type="button"
                className={`target-switcher-trigger ${isOpen ? 'target-switcher-trigger--open' : ''} ${isSwitching ? 'target-switcher-trigger--busy' : ''}`}
                onClick={handleToggle}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-label={`Target position: ${currentRole}, ${currentScore}% match. Click to switch target.`}
                disabled={isSwitching}
            >
                <span className="trigger-label-prefix">Switch Target:</span>

                <div className="trigger-content">
                    <span className="trigger-role" title={currentRole}>
                        {isSwitching ? 'Switching Target...' : currentRole}
                    </span>

                    {!isSwitching && currentScore > 0 && (
                        <span className={`trigger-score ${getScoreColorClass(currentScore)}`}>
                            {currentScore}%
                        </span>
                    )}
                </div>

                <span className={`trigger-chevron ${isOpen ? 'trigger-chevron--up' : ''}`} aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            </button>

            {/* ── Custom Portal Dropdown ── */}
            {isOpen && createPortal(
                <div className="target-switcher-portal-root">
                    {/* Backdrop for mobile */}
                    <div
                        className="target-switcher-backdrop"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Popover Menu */}
                    <div
                        ref={dropdownRef}
                        id={listboxId}
                        role="listbox"
                        aria-label="Available preparation targets"
                        className={`target-switcher-dropdown ${openUpward ? 'target-switcher-dropdown--upward' : ''}`}
                        style={dropdownStyle}
                    >
                        <div className="dropdown-header">
                            <span className="header-title">SWITCH TARGET</span>
                            <span className="header-count">{uniqueJourneys.length} Targets</span>
                        </div>

                        <div className="dropdown-options-list">
                            {uniqueJourneys.map((j, idx) => {
                                const isSelected = j._id === primaryJourney?._id;
                                const isFocused = idx === focusedIndex;
                                const score = typeof j.matchScore === 'number' ? j.matchScore : 0;
                                const isCompleted = j.status === 'COMPLETED' || j.overallProgress === 100;

                                return (
                                    <div
                                        key={j._id}
                                        ref={el => (optionsRef.current[idx] = el)}
                                        role="option"
                                        aria-selected={isSelected}
                                        tabIndex={-1}
                                        className={`target-option ${isSelected ? 'target-option--active' : ''} ${isFocused ? 'target-option--focused' : ''}`}
                                        onClick={() => handleSelectJourney(j._id)}
                                        onMouseEnter={() => setFocusedIndex(idx)}
                                    >
                                        <div className="option-row-main">
                                            <span className="option-check" aria-hidden="true">
                                                {isSelected ? '✓' : ''}
                                            </span>
                                            <span className="option-role" title={j.targetRole}>
                                                {j.targetRole}
                                            </span>
                                        </div>

                                        <div className="option-row-meta">
                                            <span className="option-company">
                                                {j.company ? `🏢 ${j.company}` : '🏢 Target Company'}
                                            </span>

                                            <div className="option-tags-group">
                                                <span className={`option-status-tag ${isCompleted ? 'option-status-tag--completed' : ''}`}>
                                                    {isCompleted ? '🎉 Completed' : `Day ${j.currentDay || 1}/${j.roadmapDays || 7}`}
                                                </span>

                                                {score > 0 && (
                                                    <span className={`option-score-tag ${getScoreColorClass(score)}`}>
                                                        {score}% Match
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TargetSwitcher;
