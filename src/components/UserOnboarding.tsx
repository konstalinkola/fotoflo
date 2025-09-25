"use client";

import { useState } from "react";

interface UserOnboardingProps {
	onComplete: () => void;
}

export default function UserOnboarding({ onComplete }: UserOnboardingProps) {
	const [currentStep, setCurrentStep] = useState(0);

	const steps = [
		{
			title: "Welcome to Kuvapalvelin Beta!",
			content: (
				<div className="space-y-4">
					<p>Kuvapalvelin is a service that automatically shares your latest photos via QR codes.</p>
					<p>Perfect for photographers who want to instantly share their work with clients or audiences.</p>
				</div>
			),
		},
		{
			title: "How It Works",
			content: (
				<div className="space-y-4">
					<div className="flex items-start gap-3">
						<div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
						<div>
							<h4 className="font-medium">Create a Project</h4>
							<p className="text-sm text-gray-600">Set up your project with a name, logo, and background color.</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
						<div>
							<h4 className="font-medium">Upload Photos</h4>
							<p className="text-sm text-gray-600">Drag and drop photos or use the upload button. The QR code automatically updates to show your latest photo.</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
						<div>
							<h4 className="font-medium">Share Your QR Code</h4>
							<p className="text-sm text-gray-600">Share the public URL with your audience. They can scan the QR code to see your latest photo.</p>
						</div>
					</div>
				</div>
			),
		},
		{
			title: "Beta Testing",
			content: (
				<div className="space-y-4">
					<p>You're part of our beta testing program! Here's what we'd love your feedback on:</p>
					<ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
						<li>Ease of uploading and managing photos</li>
						<li>QR code generation and sharing</li>
						<li>Overall user experience</li>
						<li>Any bugs or issues you encounter</li>
					</ul>
					<p className="text-sm text-gray-600">Your photos are completely private and isolated from other users.</p>
				</div>
			),
		},
	];

	const nextStep = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			onComplete();
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-md w-full p-6">
				<div className="mb-6">
					<h2 className="text-xl font-semibold mb-2">{steps[currentStep].title}</h2>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div 
							className="bg-blue-600 h-2 rounded-full transition-all duration-300"
							style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
						></div>
					</div>
					<p className="text-sm text-gray-500 mt-2">Step {currentStep + 1} of {steps.length}</p>
				</div>

				<div className="mb-6">
					{steps[currentStep].content}
				</div>

				<div className="flex justify-between">
					<button
						onClick={prevStep}
						disabled={currentStep === 0}
						className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Previous
					</button>
					<button
						onClick={nextStep}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						{currentStep === steps.length - 1 ? "Get Started" : "Next"}
					</button>
				</div>
			</div>
		</div>
	);
}
