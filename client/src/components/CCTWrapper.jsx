import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchCCT } from "../actions";
import D3HyperGraph from "../ui/d3-hyper-graph";

export default function CCTWrapper() {
	const dispatch = useDispatch();

	const selectedExperiment = useSelector((store) => store.selectedExperiment);
	const cct = useSelector((store) => store.cct);

	const [nodes, setNodes] = useState([]);
	const [links, setLinks] = useState([]);
	const [nodesDict, setNodesDict] = useState({});

	const containerID = useRef("cct-view");
	const style = {
		top: 30,
		right: 20,
		bottom: 10,
		left: 40,
		width: window.innerWidth / 3 - 30,
		height: window.innerHeight / 3
	};

	// useEffect(() => {
	// 	if (selectedExperiment !== "") {
	// 		dispatch(fetchCCT());
	// 	}
	// }, [selectedExperiment]);

	// const treeData = {
	// 	name: "train_gpt2_model",
	// 	cat: "cpu_compute",
	// 	children: [
	// 		{
	// 			name: "TrainingSpec::initialize()",
	// 			cat: "data_mov",
	// 			children: [
	// 				{
	// 					name: "load_tf_weights_in_gpt2",
	// 					cat: "data_mov",
	// 				},
	// 				{
	// 					name: "prepare_datasets()",
	// 					cat: "data_mov"
	// 				},
	// 				{
	// 					name: "TrainingSpec::construct_model()",
	// 					cat: "cpu_compute",
	// 					children: [
	// 						{
	// 							name: "TrainingSpec::trace_op()",
	// 							cat: "cpu_compute"
	// 						}
	// 					]
	// 				}
	// 			]
	// 		}, {
	// 			name: "GPT2TrainConfig::initialize()",
	// 			cat: "cpu_compute",
	// 			children: [
	// 				{
	// 					name: "Attention::init()",
	// 					cat: "cpu_compute",
	// 					children: [{
	// 						name: "Attention::prune_heads",
	// 						cat: "cpu_compute",
	// 					}, {
	// 						name: "Attention::forward",
	// 						cat: "gpu_compute",
	// 						children: [
	// 						// {
	// 						// 	name: "Attention::split_heads",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "torch::cat",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "Attention::merge_heads",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "Attention::c_proj",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "Attention::resid_dropout",
	// 						// 	cat: "gpu_compute"
	// 						// }
	// 						]
	// 					}
	// 					]
	// 				}, {
	// 					name: "MLP::init()",
	// 					cat: "cpu_compute",
	// 					children: [{
	// 						name: "MLP::forward",
	// 						cat: "gpu_compute",
	// 						children: [
	// 						// {
	// 						// 	name: "MLP::c_fc",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "MLP::act",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "MLP::c_proj",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "MLP::dropout",
	// 						// 	cat: "gpu_compute"
	// 						// }
	// 						]
	// 					}
	// 					]
	// 				}, {
	// 					name: "Block::init()",
	// 					cat: "cpu_compute",
	// 					children: [{
	// 						name: "Attention::init()",
	// 						cat: "gpu_compute",
	// 						children: [
	// 						// {
	// 						// 	name: "Block::ln_2",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "Block::mlp",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "Block::crossattention",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "Block::ln_cross_attn",
	// 						// 	cat: "gpu_compute"
	// 						// }
	// 						]
	// 					}
	// 					]
	// 				}, {
	// 					name: "Model::init()",
	// 					cat: "cpu_compute",
	// 					children: [{
	// 						name: "torch::nn::Embedding",
	// 						cat: "gpu_compute",
	// 						children: [
	// 						// {
	// 						// 	name: "torch::nn::Dropout",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "torch::nn::LayerNorm",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "Model::parallelize",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "Model::get_device_map",
	// 						// 	cat: "gpu_compute"
	// 						// }, {
	// 						// 	name: "Model::forward",
	// 						// 	cat: "gpu_compute"
	// 						// }
	// 						]
	// 					}
	// 					]
	// 				}, 
	// 				{
	// 					name: "LMHead::get_node_embeddings()",
	// 					cat: "data_mov",
	// 					children: [
	// 						{
	// 							name: "LMHead::forward()",
	// 							cat: "gpu_compute",
	// 							children: [
	// 								// {
	// 								// 	name: "LMHead::backprop()",
	// 								// 	cat: "gpu_compute"
	// 								// },
	// 								// {
	// 								// 	name: "torch::aten::einsum()",
	// 								// 	cat: "gpu_compute"
	// 								// }
	// 							]
	// 						}
	// 					]
	// 				}
	// 			]
	// 		}
	// 	]
	// };

	const treeData = {
		name: "cudaGetDeviceProperties",
		cat: "cuda",
		children: [
			{
				name: "fill_col_format(int, int, int)",
				cat: "cpu_compute",
				children: [
					{
						name: "sgemm_v2(int, int, int, float, float const*, float const*, float, float*)",
						cat: "gpu_compute"
					}
				]
			},
			{
				name: "cudaMemcpy",
				cat: "cuda",
				children: [
					{
						name: "Memcpy HtoD",
						cat: "data_mov",
						children: [
							{
								name: "Memcpy DtoH",
								cat: "data_mov"
							}
						]
					}
				]
			},
			{
				name: "cudaMalloc",
				cat: "cuda",
				children: [
					{
						name: "cudaDeviceSynchronize",
						cat: "cuda",
						children: [
							{
								name: "cudaLaunchKernel",
								cat: "cuda",
								children: [
									{
										name: "cudaFree",
										cat: "cuda",
										children: [
											{
												name: "cudaFreeHost",
												cat: "cuda"
											}
										]
									}
								]
							}
						]
					}
				]
			}
		]
	};

	return (
		<Grid container>
			{Object.keys(treeData).length > 0 ? (
				<Card style={{ borderColor: "gray" }}>
					<D3HyperGraph
						containerName={containerID.current}
						style={style}
						data={treeData}
					/>
				</Card>
			) : (
				<CircularProgress />
			)}
		</Grid>
	);
}
