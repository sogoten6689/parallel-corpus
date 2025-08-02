'use client';
import { CodeOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const InDevelop = () => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center">
            <CodeOutlined size={400}/>
            <h5>{t("in_develop")}</h5>
        </div>
    );
};

export default InDevelop;