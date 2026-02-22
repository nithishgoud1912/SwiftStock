import Link from "next/link";


const VerifyEmailAddressPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h3>Your email address has been verified.</h3>
            <Link href="/dashboard" className="text-blue-500 underline">Go to dashboard</Link>
        </div>
    );
};

export default VerifyEmailAddressPage;