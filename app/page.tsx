"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TabNavigation } from "@/components/tab-navigation"
import { ViscosityIndexTab } from "@/components/tabs/viscosity-index-tab"
import { TemperatureExtrapolationTab } from "@/components/tabs/temperature-extrapolation-tab"
import { MixtureTab } from "@/components/tabs/mixture-tab"
import { TargetViscosityTab } from "@/components/tabs/target-viscosity-tab"
import { ComplexBlendsTab } from "@/components/tabs/complex-blends-tab"
import { InfoModal } from "@/components/info-modal"
import { LanguageProvider } from "@/contexts/language-context"
import { WaltherProvider } from "@/contexts/walther-context"

export default function ViscobatApp() {
  const [activeTab, setActiveTab] = useState("vi")
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <LanguageProvider>
      <WaltherProvider>
        <div className="flex flex-col min-h-screen bg-background">
          <Header onInfoClick={() => setIsModalOpen(true)} />
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
            {activeTab === "vi" && <ViscosityIndexTab />}
            {activeTab === "temp" && <TemperatureExtrapolationTab />}
            {activeTab === "mixture" && <MixtureTab />}
            {activeTab === "twoBases" && <TargetViscosityTab />}
            {activeTab === "solver" && <ComplexBlendsTab />}
          </main>
          <Footer />
          <InfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
      </WaltherProvider>
    </LanguageProvider>
  )
}
