'use client';

import { useEffect, useRef } from 'react';
import { Check, X, FileText, UserCheck, Briefcase } from 'lucide-react';
import gsap from 'gsap';

export default function ReferralProgressBar({ currentStatus, rejection_stage, submitted_at, considered_at, final_at }) {
  const connectorRefs = useRef([]);
  const circleRefs = useRef([]);

  const stages = [
    {
      key: 'SUBMITTED',
      label: 'Submitted',
      timestamp: submitted_at,
      icon: <FileText size={16} />,
    },
    {
      key: 'SBU_REVIEW',
      label: getSbuLabel(),
      timestamp: considered_at,
      icon: <UserCheck size={20} />, // 🔍 Increased size
    },
    {
      key: 'HR_REVIEW',
      label: getHrLabel(),
      timestamp: final_at,
      icon: <Briefcase size={20} />, // 🔍 Increased size
    },
  ];

  function getSbuLabel() {
    if (currentStatus === 'REJECTED' && rejection_stage === 'SBU') return 'Rejected by SBU';
    if (currentStatus === 'CONSIDERED') return 'Approved by SBU';
    if (['FINAL_ACCEPTED', 'FINAL_REJECTED'].includes(currentStatus)) return 'Approved by SBU';
    return 'Under SBU Review';
  }

  function getHrLabel() {
    if (currentStatus === 'REJECTED' && rejection_stage === 'HR') return 'Rejected by HR';
    if (currentStatus === 'FINAL_REJECTED') return 'Rejected by HR';
    if (currentStatus === 'FINAL_ACCEPTED') return 'Accepted by HR';
    if (currentStatus === 'CONSIDERED') return 'Under HR Review';  // ✅ add this
    return 'Under HR Review';
  }

  const getActiveIndex = () => {
    if (currentStatus === 'REJECTED' && rejection_stage === 'SBU') return 1;
    if (currentStatus === 'REJECTED' && rejection_stage === 'HR') return 2;
    if (['FINAL_ACCEPTED', 'FINAL_REJECTED'].includes(currentStatus)) return 2;
    if (currentStatus === 'CONSIDERED') return 2; // ✅ Show HR in progress
    return 1;
  };

  const activeIndex = getActiveIndex();

  useEffect(() => {
    connectorRefs.current.forEach((el, i) => {
      if (i < activeIndex && el) {
        gsap.to(el, {
          width: '100%',
          backgroundColor: '#9333ea',
          duration: 0.8,
          delay: i * 0.4,
          ease: 'power2.out'
        });
      }
    });

    if (circleRefs.current[activeIndex]) {
      gsap.fromTo(
        circleRefs.current[activeIndex],
        { scale: 0.9 },
        {
          scale: 1.8,
          repeat: 3,
          yoyo: true,
          duration: 0.2,
          ease: 'power2.inOut',
          delay: activeIndex * 0.4 + 0.3
        }
      );
    }
  }, [activeIndex]);

  return (
    <div className="flex items-center justify-between w-full mt-6 px-4 relative">
      {stages.map((step, index) => {
        const isActive = index === activeIndex;
        const isCompleted = index < activeIndex;
        const isRejected =
          (step.key === 'SBU_REVIEW' && currentStatus === 'REJECTED' && rejection_stage === 'SBU') ||
          (step.key === 'HR_REVIEW' && currentStatus === 'FINAL_REJECTED');

        const icon =
          isRejected ? <X size={16} /> : isCompleted ? <Check size={16} /> : step.icon;

        return (
          <div key={step.key} className="flex-1 flex flex-col items-center relative">
            {/* Connector Line */}
            {index !== 0 && (
              <div
                ref={(el) => (connectorRefs.current[index - 1] = el)}
                className={`absolute top-4 -left-1/2 h-1 w-0 z-0 bg-gray-300 transition-all`}
              />
            )}

            {/* Circle Icon */}
            <div
              ref={(el) => (circleRefs.current[index] = el)}
              className={`z-10 rounded-full w-9 h-9 flex items-center justify-center text-white transition-all duration-300
                ${
                  isRejected
                    ? 'bg-red-500'
                    : isActive
                    ? 'bg-purple-700'
                    : isCompleted
                    ? 'bg-purple-400'
                    : 'bg-gray-300'
                }`}
            >
              {icon}
            </div>

            {/* Label */}
            <div
              className={`text-[10px] mt-2 text-center transition-all ${
                isRejected
                  ? 'text-red-500 font-semibold'
                  : isActive
                  ? 'text-purple-700 font-semibold'
                  : 'text-gray-500'
              }`}
            >
              {step.label}
            </div>

            {/* Timestamp */}
            {step.timestamp ? (
              <div className="text-[9px] text-gray-400 mt-1">
                {new Date(step.timestamp).toLocaleString()}
              </div>
            ) : (
              <div className="text-[9px] text-gray-400 mt-1">Pending...</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
