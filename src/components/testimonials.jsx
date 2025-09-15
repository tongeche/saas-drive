import React from "react";

// helper: works for /assets/... (public/) and leaves http(s) alone
const asset = (p) => (/^https?:\/\//i.test(p) ? p : `${import.meta.env.BASE_URL}${p.replace(/^\/+/, "")}`);

export default function TestimonialCardsSection() {
  const testimonials = [
    {
      id: 1,
      quote: "We became 2x faster and more efficient after starting to use Finovo.",
      author: "Yaroslivia Awuonda",
      title: "Project Manager",
      avatar: "/assets/imgs/review.png",
    },
    {
      id: 2,
      quote: "The intuitive interface and robust features saved us countless hours each week.",
      author: "Michael Chen",
      title: "CEO, Tech Solutions",
      avatar: "https://via.placeholder.com/150/3c6b5b/ffffff?text=MC",
    },
    {
      id: 3,
      quote:
        "From invoicing to expense tracking, Finovo handles it all with ease. I am more organized and productive.",
      author: "Sophia Mendes",
      title: "Operations Officer",
      avatar: "/assets/imgs/testimonial-img1.png"
    },
  ];

  const mainTestimonial = {
    id: 1,
    quote:
      "My experience with this platform so far has been great. Everything is easy, from creating visualization, scheduling, collaboration and many more.",
    author: "Bettie Porter",
    title: "Senior Marketing Manager",
    avatar: "/assets/imgs/reviewer1.png",
  };

  return (
    <section className="bg-finovo-light/20 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-2xl font-extrabold text-gray-900 dark:text-white text-center mb-12">
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
              src={asset("/assets/imgs/reviewer1.png")}
              alt={mainTestimonial.author}
              className="w-full lg:w-96 rounded-3xl shadow-lg object-cover"
            />
            {/* Play button overlay */}
         
          </div>
        </div>


      </div>
    </section>
  );
}
