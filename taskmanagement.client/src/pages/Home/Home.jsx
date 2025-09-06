import React from 'react';
import Breadcrumb from "../../components/Breadcrumb";
import LayoutMain from "../../layouts/LayoutMain";

const Home = () => {
    return (
        <LayoutMain>
            <>
                <div className="app-container">
                    <Breadcrumb />

                    <main className="content-main">

                    </main>
                </div>
            </>
        </LayoutMain>
    );
};

export default Home;
