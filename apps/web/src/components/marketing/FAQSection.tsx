'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-100 dark:border-gray-800">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-start justify-between text-left group"
            >
                <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors pr-8">
                    {question}
                </h4>
                <motion.span 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="material-symbols-outlined text-gray-400 group-hover:text-primary"
                >
                    expand_more
                </motion.span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-gray-500 dark:text-gray-400 leading-relaxed">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const FAQSection: React.FC = () => {
    const faqs = [
        {
            question: "Can I switch plans anytime?",
            answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected on your next billing cycle. If you upgrade, the new features are available immediately."
        },
        {
            question: "Is my health data secure?",
            answer: "Security is our priority. We use AES-256 encryption at rest and in transit. The service is fully HIPAA-compliant to ensure your sensitive records are never compromised."
        },
        {
            question: "What is RAG AI Chat?",
            answer: "Retrieval-Augmented Generation (RAG) allows our AI to look up specific data within your *own* uploaded health records to answer questions. This makes the answers clinically accurate and specific to your history, rather than generic web info."
        },
        {
            question: "Do you offer refunds?",
            answer: "We offer a 14-day money-back guarantee for all our Pro and Family annual plans if you're not completely satisfied with the service."
        }
    ];

    return (
        <section className="py-24 px-6 lg:px-24 bg-gray-50/50 dark:bg-gray-900/20">
            <div className="max-w-[1000px] mx-auto">
                 <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-5xl font-black mb-6 dark:text-white text-text-main">
                        Frequently Asked Questions
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="md:contents">
                            {/* Render logic: Wrap every 2 items or just grid flow? Grid flow works if items are similar height. 
                                For safer alignment let's just mapped them into the grid directly. 
                                Actually, the FAQItem has border-b, so grid might look disjointed if they aren't rows.
                                Let's standard listing for better readability.
                            */}
                             <FAQItem {...faq} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
