import React from 'react';

export default function TestimonialCardsSection() {
  const testimonials = [
    {
      id: 1,
      quote: "We became 2x faster and more efficient after starting to use Finovo.",
      author: "Yaroslivia Awuonda",
      title: "Project Manager",
      avatar: "/assets/imgs/review.png" // Placeholder avatar
    },
    {
      id: 2,
      quote: "The intuitive interface and robust features saved us countless hours each week.",
      author: "Michael Chen",
      title: "CEO, Tech Solutions",
      avatar: "https://via.placeholder.com/150/3c6b5b/ffffff?text=MC" // Placeholder avatar
    },
    {
      id: 3,
      quote: "From invoicing to expense tracking, Finovo handles it all with ease. I am more organized and productive.",
      author: "Sophia Mendes",
      title: "Operations Officer",
      avatar: "/public/assets/imgs/reviewer1.png" // Placeholder avatar
    },

  ];

  const mainTestimonial = {
    id: 1,
    quote: "My experience with this platform so far has been great. Everything is easy, from creating visualization, scheduling, collaboration and many more.",
    author: "Bettie Porter",
    title: "Senior Marketing Manager",
    avatar: "/assets/imgs/login-review.png" // Placeholder avatar
  };

  return (
    <section className="bg-finovo-light/20 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-12">
          Loved by industry leaders
        </h2>
        
        {/* Main Testimonial Card */}
        <div className="flex flex-col lg:flex-row items-center justify-center lg:space-x-12 mb-12">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg mb-8 lg:mb-0">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-finovo/10 text-finovo-dark mr-4">
                <i className="fa-solid fa-quote-left text-xl"></i>
              </div>
              <p className="text-sm font-semibold text-finovo-dark">{mainTestimonial.author}</p>
            </div>
            <p className="text-xl text-gray-800 font-medium leading-relaxed">
              "{mainTestimonial.quote}"
            </p>
          </div>
          <div className="relative">
            <img 
              src="/assets/imgs/betty.png" 
              alt={mainTestimonial.author}
              className="w-full lg:w-96 rounded-3xl shadow-lg object-cover"
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110">
                <i className="fa-solid fa-play text-gray-900 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Smaller Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.slice(0, 2).map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-3xl shadow-xl p-8 flex flex-col justify-between h-full">
              {/* Star rating placeholder */}
              <div className="text-yellow-400 mb-4">
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.author} 
                  className="w-14 h-14 rounded-full mr-4 object-cover" 
                />
                <div>
                  <p className="font-bold text-lg text-gray-900">{testimonial.author}</p>
                  <p className="text-gray-500 text-sm">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}