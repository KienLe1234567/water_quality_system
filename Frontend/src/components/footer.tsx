"use client";
import Image from "next/image";
import Link from "next/link";
import logo from "/public/thuvien.jpg";
const AppFooter = () => {
  return (
    <div>
    <div className="pb-2 border-b border-gray-800">
      <p></p>
    </div>
    <div
      className="bg-light bg-gradient px-2 text-primary-emphasis"
      style={{ fontFamily: "Inria Serif, serif", padding: "50px 0 30px 0" }}
    >
      <div className="container mx-auto flex flex-col gap-5 md:flex-row">
        <div className="flex flex-col gap-2 w-full max-w-md">
          <h2 className="text-2xl font-semibold">Hotel sample</h2>
          <div className="rounded-3 flex justify-center items-center">
            <Image
              src={logo}
              alt="school"
              width={450}
              className="rounded-3"
            />
          </div>
        </div>
        <div className="flex mx-5 flex-col gap-2 w-full">
          <h2 className="text-2xl font-semibold">Website</h2>
          <div className="flex flex-col gap-2 text-primary-emphasis text-sm">
            <Link
              href={"https://hotelBooker.vn"}
              className="no-underline text-primary-emphasis italic underline"
            >
              hotelBooker
            </Link>
            <Link
              href={"https://hotelAsker.vn"}
              className="no-underline text-primary-emphasis italic underline"
            >
              hotelAsker
            </Link>
            <Link
              href={"https://hotelReporter.vn"}
              className="no-underline text-primary-emphasis italic underline"
            >
              hotelReporter
            </Link>
          </div>
        </div>
        <div className="flex mx-5 flex-col gap-2 w-full">
          <h2 className="text-2xl font-semibold">Address</h2>
          <div className="flex flex-col gap-2 text-sm">
            <p>234 Pasteur Street, Ward 3, District 1, HCM City</p>
            <p>(028) 38 651 670 - (028) 38 647 256</p>
            <p>donotMail@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default AppFooter;
