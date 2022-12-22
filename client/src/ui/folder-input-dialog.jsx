import CloseIcon from "@mui/icons-material/Close";
import InboxIcon from "@mui/icons-material/Inbox";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import MuiListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { makeStyles, styled, withStyles } from "@mui/styles";
import React, { useState } from "react";
import { useDispatch } from "react-redux";

import { loadExample } from "../actions";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
	"& .MuiDialogContent-root": {
		background: "white",
		padding: theme.spacing(2)
	},
	"& .MuiDialogActions-root": {
		padding: theme.spacing(1)
	}
}));

const ListItem = withStyles({
	root: {
		"&$selected": {
			backgroundColor: "blue",
			color: "black",
			"& .MuiListItemIcon-root": {
				color: "black"
			},
			borderRadius: "2px"
		},
		"&$selected:hover": {
			backgroundColor: "purple",
			color: "black",
			"& .MuiListItemIcon-root": {
				color: "black"
			},
			borderRadius: "2px"
		},
		"&:hover": {
			backgroundColor: "#04ACB5",
			color: "black",
			"& .MuiListItemIcon-root": {
				color: "black"
			},
			borderRadius: "2px"
		}
	},
	selected: {}
})(MuiListItem);

const useStyles = makeStyles((theme) => ({
	button: {
		backgroundColor: "#04ACB5", 
		color: "white",
		'&:hover': {
			backgroundColor: '#fff',
			color: '#04ACB5',
		}
	},
}));

function BootstrapDialogTitle(props) {
	const { children, onClose, ...other } = props;

	return (
		<DialogTitle sx={{ m: 0, p: 2 }} {...other}>
			{children}
			{onClose ? (
				<IconButton
					aria-label="close"
					onClick={onClose}
					sx={{
						position: "absolute",
						right: 8,
						top: 8
					}}
				>
					<CloseIcon />
				</IconButton>
			) : null}
		</DialogTitle>
	);
}

export default function CustomizedDialogs() {
	const dispatch = useDispatch();
	const classes = useStyles();

	const [open, setOpen] = useState(true);
	const [selectedExample, setSelectedExample] = useState("");

	const examples = { "sgemm-kernel-opt": "SGEMM Kernel Optimization", 
						"sgemm-uvm-opt": "SGEMM UVM",
						"comb-post-send-1024_1024_1024": "Comb post-send 1024_1024_1024",
						"comb-post-send-wait-all-scale-up": "Comb post-send wait-all scale-up"
					};

	const handleClickOpen = () => {
		setOpen(true);
	};
	const handleClose = () => {
		if (selectedExample != "") {
			dispatch(loadExample(selectedExample));
			setOpen(false);
		}
	};

	const handleListItemClick = (event, example) => {
		setSelectedExample(example);
	};

	return (
			<BootstrapDialog
				onClose={handleClose}
				aria-labelledby="customized-dialog-title"
				open={open}
			>
				<BootstrapDialogTitle
					id="customized-dialog-title"
					onClose={handleClose}
				>
					Welcome to Data Movement Visualized!
				</BootstrapDialogTitle>
				<DialogContent dividers>
					<Typography gutterBottom>
					A large number of applications have started exploiting the <b>heterogeneous execution models involving CPUs and GPUs</b>. To leverage such heterogeneous executions, application developers need to allocate resources, divide the compute between CPU and GPU effectively, and ensure minimal data movement costs.
					<br /><br />
					<b>Data movement</b> across devices is a key limiting factor in heterogeneous architectures where the host (i.e., CPU) orchestrates the computation by distributing the computation workload to the devices, while the devices (i.e., CPU or GPU) execute parallel operations.
					<br /><br />
					To achieve good <b>scalability</b> and <b>performance</b>, one must minimize unnecessary data movement operations and the volume of data transferred between devices.  This tool is designed to enable developers visualize and analyze track data movement in CUDA-enabled applications. For collecting the data, please refer https://github.com/jarusified/DataMovProfiler.
					<br /><br />
					To begin using the tool, please select one of the below examples,

					</Typography>
					<List>
						{Object.entries(examples).map((example, idx) => (
							<ListItem
								key={idx}
								button
								disablePadding
								selected={selectedExample === example[0]}
								onClick={(event) =>
									handleListItemClick(event, example[0])
								}
							>
								<ListItemButton>
									<ListItemIcon>
										<InboxIcon />
									</ListItemIcon>
									<ListItemText primary={example[1]} />
								</ListItemButton>
							</ListItem>
						))}
					</List>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleClose}
						className={classes.button}
					>
						Load
					</Button>
				</DialogActions>
			</BootstrapDialog>
	);
}
