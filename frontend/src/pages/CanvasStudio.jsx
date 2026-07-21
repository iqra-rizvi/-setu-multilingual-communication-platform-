import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function CanvasStudio() {

const [campaigns, setCampaigns] = useState([]);

const [selectedCampaign, setSelectedCampaign] = useState(null);

const [posterContent, setPosterContent] = useState("");

const [generatedPoster, setGeneratedPoster] = useState(null);

const [savedPoster, setSavedPoster] = useState(false);

console.log(campaigns);

useEffect(() => {

  api.get("/campaigns")
    .then((res) => {
      setCampaigns(res.data);
    })
    .catch((err) => {
      console.log(err);
    });

}, []);

const generatePoster = () => {

  if (!selectedCampaign) {
    alert("Please select a campaign first");
    return;
  }

  const poster = {
    campaign: selectedCampaign.name,
    language: "Telugu",
    content: posterContent || "Your campaign message will appear here"
  };

  setGeneratedPoster(poster);

};


const savePoster = async () => {

  if (!generatedPoster) {
    alert("Generate a poster first");
    return;
  }


  try {

    const response = await api.post("/posters/", {

      campaign_id: selectedCampaign.id,

      title: selectedCampaign.name,

      language: generatedPoster.language,

      content: generatedPoster.content

    });


    console.log("Poster saved:", response.data);


    setSavedPoster(true);


  } catch (error) {

    console.log("Save poster error:", error);

    alert("Failed to save poster");

  }

};

  return (
    <div>
<header className="mb-7">

<h1 className="font-display text-2xl font-semibold">
Canvas Studio
</h1>

<p className="text-text-dim text-sm mt-1">
Create AI-powered posters for multilingual public awareness campaigns.
</p>

</header>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
<div className="bg-surface border border-border rounded-xl p-5">

<h2 className="font-display text-sm font-semibold mb-5">
AI Poster Generator
</h2>

{selectedCampaign && (
  <div className="mb-4 p-3 rounded-lg bg-surface-alt border border-border">

    <p className="text-xs text-text-dim">
      Selected Campaign
    </p>

    <p className="text-sm font-medium mt-1">
      {selectedCampaign.name}
    </p>

  </div>
)}

<label className="text-xs text-text-dim">
Campaign Type
</label>


<select className="mt-2 w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm mb-4">

<option>Agriculture</option>
<option>Health</option>
<option>Education</option>

</select>


<label className="text-xs text-text-dim">
Language
</label>


<select className="mt-2 w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm">

<option>English</option>
<option>Telugu</option>
<option>Hindi</option>
<option>Tamil</option>
<option>Malayalam</option>

</select>

<label className="text-xs text-text-dim mt-4 block">
Poster Content
</label>


<textarea
value={posterContent}
onChange={(e)=>setPosterContent(e.target.value)}
placeholder="Enter announcement details..."
className="
mt-2
w-full
h-28
bg-surface-alt
border
border-border
rounded-lg
px-3
py-3
text-sm
resize-none
"
/>

<button
type="button"
onClick={generatePoster}
className="
mt-5
w-full
rounded-lg
bg-blue-950
text-white
py-2.5
text-sm
font-medium
hover:opacity-90
transition
"
>
✨ Generate Poster
</button>

</div>
<div className="bg-surface border border-border rounded-xl p-5">


<h2 className="font-display text-sm font-semibold mb-5">
Templates
</h2>


<div className="grid grid-cols-2 gap-4">


{campaigns.length > 0 ? (

campaigns.map((campaign) => (

<div
key={campaign.id}
onClick={() => setSelectedCampaign(campaign)}
className="
h-28
bg-surface-alt
border border-border
rounded-xl
p-4
cursor-pointer
hover:border-violet
transition
"
>

<h3 className="text-sm font-medium">
{campaign.name}
</h3>


<p className="text-xs text-text-dim mt-1">
{campaign.language || "Multilingual"}
</p>


</div>


))

) : (

<p className="text-sm text-text-dim">
No campaigns available
</p>

)}


</div>



</div>
<div className="bg-surface border border-border rounded-xl p-5">

<h2 className="font-display text-sm font-semibold mb-5">
Live Preview
</h2>


<div className="
h-96
bg-surface-alt
border border-border
rounded-xl
flex
items-center
justify-center
">

<div className="text-center">

<div className="text-5xl mb-3">
🖼
</div>

{generatedPoster ? (

<div className="text-center p-5">

<h3 className="text-lg font-semibold">
{generatedPoster.campaign}
</h3>


<p className="text-xs text-text-dim mt-2">
Language: {generatedPoster.language}
</p>


<div className="
mt-4
p-4
rounded-lg
bg-surface
border border-border
text-sm
">

{generatedPoster.content}

<button
onClick={savePoster}
className="
mt-5
w-full
rounded-lg
border border-border
py-2
text-sm
text-text-dim
hover:text-text
transition
"
>
{savedPoster ? "✓ Saved to Campaign" : "Save to Campaign"}
</button>

</div>


</div>

) : (

<div className="text-center">

<div className="text-5xl mb-3">
🖼
</div>

<p className="text-text-dim text-sm">
Poster Preview
</p>

</div>

)}

</div>

</div>

</div>
</div>
    </div>
  );
}
