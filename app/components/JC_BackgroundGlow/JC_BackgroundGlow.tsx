"use client";

// Styles
import styles from "./JC_BackgroundGlow.module.scss";
// React
import { useEffect, useState, useRef } from "react";

// Configuration constants
const GLOW_CONFIG = {
    // Size as a percentage of the larger screen dimension (width or height)
    SIZE_FACTOR: 0.25,
    // Speed range for orb movement
    MIN_SPEED: 0.8,
    MAX_SPEED: 1.3,
    // Minimum speed to prevent orbs from getting stuck
    MIN_VELOCITY: 0.5,
    // Maximum speed to prevent orbs from moving too fast
    MAX_VELOCITY: 2.5,
    // Bounce randomness factors (values closer to 1.0 make bounces more predictable)
    MIN_BOUNCE_FACTOR: 0.8,
    MAX_BOUNCE_FACTOR: 1.2,
    // Number of orbs to display
    ORB_COUNT: 2,
    // How far past the window edge orbs can travel before bouncing (in pixels)
    BOUNDARY_EXTENSION: 50
};

// Interface for a glow orb
interface GlowOrb {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    size: number;
}

export default function JC_BackgroundGlow() {
    // State for window size
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    // State for glow orbs
    const [orbs, setOrbs] = useState<GlowOrb[]>([]);

    // Animation frame reference
    const animationFrameRef = useRef<number | null>(null);

    // Initialize on component mount
    useEffect(() => {
        // Set initial window size
        const initialSize = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        setWindowSize(initialSize);

        // Create orbs with random positions and velocities based on config
        const initialOrbs: GlowOrb[] = Array.from({ length: GLOW_CONFIG.ORB_COUNT }, () => createOrb(initialSize));
        setOrbs(initialOrbs);

        // Handle window resize
        const handleResize = () => {
            const newSize = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            setWindowSize(newSize);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Create a new orb with random position and velocity
    const createOrb = (size: { width: number; height: number }): GlowOrb => {
        // Calculate orb size based on window dimensions and config
        const orbSize = Math.max(size.width, size.height) * GLOW_CONFIG.SIZE_FACTOR;

        // Random position within window bounds
        const position = {
            x: Math.random() * (size.width - orbSize) + orbSize / 2,
            y: Math.random() * (size.height - orbSize) + orbSize / 2
        };

        // Random velocity (speed and direction) based on config
        const speed = GLOW_CONFIG.MIN_SPEED + Math.random() * (GLOW_CONFIG.MAX_SPEED - GLOW_CONFIG.MIN_SPEED);
        const angle = Math.random() * Math.PI * 2; // Random angle in radians

        const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };

        return {
            position,
            velocity,
            size: orbSize
        };
    };

    // Animate orbs
    useEffect(() => {
        if (orbs.length === 0 || windowSize.width === 0) return;

        const animateOrbs = () => {
            setOrbs(prevOrbs => {
                return prevOrbs.map(orb => {
                    // Calculate new position
                    const newX = orb.position.x + orb.velocity.x;
                    const newY = orb.position.y + orb.velocity.y;

                    // Check for collisions with window edges
                    let newVelocityX = orb.velocity.x;
                    let newVelocityY = orb.velocity.y;

                    // Function to generate a random bounce angle
                    const getRandomBounceVelocity = (currentVelocity: number) => {
                        // Base the new velocity on the current one, but add randomness
                        // Keep the same general direction but vary by up to +/- 45 degrees
                        const randomFactor = GLOW_CONFIG.MIN_BOUNCE_FACTOR + Math.random() * (GLOW_CONFIG.MAX_BOUNCE_FACTOR - GLOW_CONFIG.MIN_BOUNCE_FACTOR);
                        return -currentVelocity * randomFactor;
                    };

                    // Calculate extended boundaries with the boundary extension
                    const leftBoundary = -GLOW_CONFIG.BOUNDARY_EXTENSION;
                    const rightBoundary = windowSize.width + GLOW_CONFIG.BOUNDARY_EXTENSION;
                    const topBoundary = -GLOW_CONFIG.BOUNDARY_EXTENSION;
                    const bottomBoundary = windowSize.height + GLOW_CONFIG.BOUNDARY_EXTENSION;

                    // Bounce off left or right edge with random angle (using extended boundaries)
                    if (newX - orb.size / 2 < leftBoundary || newX + orb.size / 2 > rightBoundary) {
                        newVelocityX = getRandomBounceVelocity(orb.velocity.x);
                        // Add a small random change to Y velocity too (reduced from 2 to 0.5 to prevent acceleration)
                        newVelocityY = orb.velocity.y + (Math.random() * 0.5 - 0.25);
                    }

                    // Bounce off top or bottom edge with random angle (using extended boundaries)
                    if (newY - orb.size / 2 < topBoundary || newY + orb.size / 2 > bottomBoundary) {
                        newVelocityY = getRandomBounceVelocity(orb.velocity.y);
                        // Add a small random change to X velocity too (reduced from 2 to 0.5 to prevent acceleration)
                        newVelocityX = orb.velocity.x + (Math.random() * 0.5 - 0.25);
                    }

                    // Ensure minimum velocity to prevent orbs from getting stuck or moving too slowly
                    const ensureMinimumVelocity = (vx: number, vy: number) => {
                        const minSpeed = GLOW_CONFIG.MIN_VELOCITY;
                        const currentSpeed = Math.sqrt(vx * vx + vy * vy);

                        if (currentSpeed < minSpeed) {
                            // If speed is too low, increase it while maintaining direction
                            const factor = minSpeed / currentSpeed;
                            return {
                                x: vx * factor,
                                y: vy * factor
                            };
                        }

                        // If speed is already sufficient, return original velocities
                        return { x: vx, y: vy };
                    };

                    // Ensure maximum velocity to prevent orbs from moving too fast
                    const ensureMaximumVelocity = (vx: number, vy: number) => {
                        const maxSpeed = GLOW_CONFIG.MAX_VELOCITY;
                        const currentSpeed = Math.sqrt(vx * vx + vy * vy);

                        if (currentSpeed > maxSpeed) {
                            // If speed is too high, reduce it while maintaining direction
                            const factor = maxSpeed / currentSpeed;
                            return {
                                x: vx * factor,
                                y: vy * factor
                            };
                        }

                        // If speed is already within limit, return original velocities
                        return { x: vx, y: vy };
                    };

                    // Apply minimum velocity check
                    let adjustedVelocity = ensureMinimumVelocity(newVelocityX, newVelocityY);

                    // Apply maximum velocity check
                    const finalVelocity = ensureMaximumVelocity(adjustedVelocity.x, adjustedVelocity.y);

                    // Return updated orb
                    return {
                        ...orb,
                        position: {
                            x: newX - orb.size / 2 < leftBoundary ? leftBoundary + orb.size / 2 : newX + orb.size / 2 > rightBoundary ? rightBoundary - orb.size / 2 : newX,
                            y: newY - orb.size / 2 < topBoundary ? topBoundary + orb.size / 2 : newY + orb.size / 2 > bottomBoundary ? bottomBoundary - orb.size / 2 : newY
                        },
                        velocity: {
                            x: finalVelocity.x,
                            y: finalVelocity.y
                        }
                    };
                });
            });

            // Continue animation
            animationFrameRef.current = requestAnimationFrame(animateOrbs);
        };

        // Start animation
        animationFrameRef.current = requestAnimationFrame(animateOrbs);

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [orbs.length, windowSize]);

    return (
        <div className={styles.glowContainer}>
            {orbs.map((orb, index) => (
                <div
                    key={index}
                    className={styles.glowElement}
                    style={{
                        width: `${orb.size}px`,
                        height: `${orb.size}px`,
                        transform: `translate(${orb.position.x - orb.size / 2}px, ${orb.position.y - orb.size / 2}px)`
                    }}
                />
            ))}
        </div>
    );
}
