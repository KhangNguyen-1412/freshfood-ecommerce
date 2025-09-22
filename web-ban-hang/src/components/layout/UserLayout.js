import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import BranchSelector from "../../pages/BranchSelector";
import Breadcrumbs from "../common/Breadcrumbs";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};

const UserLayout = () => {
  const location = useLocation();
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-grow">
        <BranchSelector />
        <Breadcrumbs />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname} // Key là đường dẫn để AnimatePresence biết khi nào trang thay đổi
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default UserLayout;
