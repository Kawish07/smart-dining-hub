"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      if (response.ok) {
        router.push("/auth/login");
      } else {
        setErrors({ submit: data.message || "Signup failed" });
      }
    } catch (error) {
      setErrors({ submit: "An error occurred during signup" });
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div className="w-full mb-8">
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${step >= 1 ? 'bg-gradient-to-r from-blue-500/90 to-purple-500/90 text-white' : 'bg-gray-200/70'}`}>
              Account
            </span>
          </div>
          <div className="text-right">
            <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${step >= 2 ? 'bg-gradient-to-r from-blue-500/90 to-purple-500/90 text-white' : 'bg-gray-200/70'}`}>
              Security
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200/50 backdrop-blur-sm">
          <div style={{ width: step === 1 ? "50%" : "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500/90 to-purple-500/90 transition-all duration-500"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Left panel - Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-xl shadow-lg p-8 border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
            <p className="text-gray-600 mt-2">Join our community today</p>
          </div>

          {renderProgressBar()}

          {errors.submit && (
            <div className="mb-6 p-3 bg-red-100/80 backdrop-blur-sm border-l-4 border-red-500 text-red-700 rounded">
              <p>{errors.submit}</p>
            </div>
          )}

          <form onSubmit={step === 1 ? handleNextStep : handleSignup}>
            {step === 1 ? (
              // Step 1: Personal Information
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`pl-10 w-full p-3 bg-white/50 backdrop-blur-sm border rounded-lg focus:ring-blue-400 focus:border-blue-400 focus:bg-white/80 transition-all duration-200 ${errors.firstName ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="John"
                      />
                    </div>
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`pl-10 w-full p-3 bg-white/50 backdrop-blur-sm border rounded-lg focus:ring-blue-400 focus:border-blue-400 focus:bg-white/80 transition-all duration-200 ${errors.lastName ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="Doe"
                      />
                    </div>
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-sm text-white py-3 rounded-lg hover:from-blue-600/90 hover:to-purple-600/90 transition duration-200 shadow-sm"
                >
                  Continue
                </button>
              </>
            ) : (
              // Step 2: Account Information
              <>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`pl-10 w-full p-3 bg-white/50 backdrop-blur-sm border rounded-lg focus:ring-blue-400 focus:border-blue-400 focus:bg-white/80 transition-all duration-200 ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`pl-10 w-full p-3 bg-white/50 backdrop-blur-sm border rounded-lg focus:ring-blue-400 focus:border-blue-400 focus:bg-white/80 transition-all duration-200 ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="••••••••"
                      />
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`pl-10 w-full p-3 bg-white/50 backdrop-blur-sm border rounded-lg focus:ring-blue-400 focus:border-blue-400 focus:bg-white/80 transition-all duration-200 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="••••••••"
                      />
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>

                  <div className="flex items-center">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-400 border-gray-300 rounded"
                      required
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                      I agree to the{" "}
                      <Link href="/terms" className="text-blue-500 hover:text-blue-600 transition-colors">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-blue-500 hover:text-blue-600 transition-colors">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>

                <div className="mt-8 flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 bg-gray-200/70 backdrop-blur-sm text-gray-800 py-3 rounded-lg hover:bg-gray-300/70 transition duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-sm text-white py-3 rounded-lg hover:from-blue-600/90 hover:to-purple-600/90 transition duration-200 flex justify-center items-center shadow-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-medium text-blue-500 hover:text-blue-600 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right panel - Visual Appeal */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-tr mb-5 mt-5 from-blue-500/80 to-purple-600/80 backdrop-blur-lg justify-center items-center">
        <div className="max-w-md px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Join Our Community</h1>
          <p className="text-xl text-blue-100 mb-8">
            Create an account and get access to all features of our application.
          </p>
          
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/10 hover:bg-white/20 transition-all duration-300">
              <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Secure</h3>
              <p className="text-blue-100">Your data is always protected with us.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/10 hover:bg-white/20 transition-all duration-300">
              <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Fast</h3>
              <p className="text-blue-100">Experience lightning-fast performance.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/10 hover:bg-white/20 transition-all duration-300">
              <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                </svg>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Support</h3>
              <p className="text-blue-100">24/7 support for all your needs.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/10 hover:bg-white/20 transition-all duration-300">
              <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                </svg>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Customizable</h3>
              <p className="text-blue-100">Tailor the experience to your needs.</p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg border border-white/10">
              <p className="text-white font-medium">Join 10,000+ users already loving our platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}